// FFmpeg Executor
//
// Handles FFmpeg and FFprobe command execution for media operations.
// Provides methods for metadata extraction, thumbnail generation, and video export.

use std::process::Command;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaMetadata {
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub codec: String,
    pub bitrate: u64,
    pub file_size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClipInfo {
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "startTime")]
    pub start_time: f64,
    pub duration: f64,
    #[serde(rename = "trimStart")]
    pub trim_start: f64,
    #[serde(rename = "trimEnd")]
    pub trim_end: f64,
}

pub struct FFmpegExecutor {
    ffmpeg_path: PathBuf,
    ffprobe_path: PathBuf,
}

impl FFmpegExecutor {
    /// Creates a new FFmpegExecutor instance with bundled binary paths
    /// Uses multi-strategy fallback: production bundle -> development -> system PATH
    pub fn new() -> Result<Self, String> {
        let mut attempted_paths = Vec::new();
        
        // Strategy 1: Production app bundle Resources directory
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get executable path: {}", e))?;
        
        let resources_binaries = exe_path
            .parent()                          // Contents/MacOS/ -> Contents/
            .and_then(|p| p.parent())          // Contents/ -> MyApp.app/
            .and_then(|p| p.parent())          // MyApp.app/ -> parent dir
            .map(|p| p.join("Contents").join("Resources").join("binaries"));
        
        if let Some(ref path) = resources_binaries {
            attempted_paths.push(format!("Production Resources: {}", path.display()));
            let ffmpeg = path.join("ffmpeg");
            let ffprobe = path.join("ffprobe");
            
            if ffmpeg.exists() && ffprobe.exists() {
                eprintln!("✓ Found FFmpeg binaries in production Resources:");
                eprintln!("  ffmpeg:  {:?}", ffmpeg);
                eprintln!("  ffprobe: {:?}", ffprobe);
                return Ok(Self { 
                    ffmpeg_path: ffmpeg, 
                    ffprobe_path: ffprobe 
                });
            }
        }
        
        // Strategy 2: Development manifest directory
        if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
            let binaries_dir = PathBuf::from(manifest_dir).join("binaries");
            attempted_paths.push(format!("Development manifest: {}", binaries_dir.display()));
            
            let ffmpeg = binaries_dir.join("ffmpeg");
            let ffprobe = binaries_dir.join("ffprobe");
            
            if ffmpeg.exists() && ffprobe.exists() {
                eprintln!("✓ Found FFmpeg binaries in development:");
                eprintln!("  ffmpeg:  {:?}", ffmpeg);
                eprintln!("  ffprobe: {:?}", ffprobe);
                return Ok(Self { 
                    ffmpeg_path: ffmpeg, 
                    ffprobe_path: ffprobe 
                });
            }
        }
        
        // Strategy 3: System PATH (fallback)
        attempted_paths.push("System PATH".to_string());
        if let Ok(ffmpeg_path) = which::which("ffmpeg") {
            if let Ok(ffprobe_path) = which::which("ffprobe") {
                eprintln!("✓ Found FFmpeg binaries in system PATH:");
                eprintln!("  ffmpeg:  {:?}", ffmpeg_path);
                eprintln!("  ffprobe: {:?}", ffprobe_path);
                return Ok(Self { ffmpeg_path, ffprobe_path });
            }
        }
        
        // All strategies failed - provide detailed error
        Err(format!(
            "FFmpeg binaries not found. Attempted paths:\n{}",
            attempted_paths.join("\n")
        ))
    }
    
    /// Get metadata from a video file using FFprobe
    pub fn get_metadata(&self, file_path: &str) -> Result<MediaMetadata, String> {
        let output = Command::new(&self.ffprobe_path)
            .args(&[
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                file_path
            ])
            .output()
            .map_err(|e| format!("FFprobe execution failed: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("FFprobe failed: {}", stderr));
        }
        
        let json: Value = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("Failed to parse FFprobe output: {}", e))?;
        
        self.parse_metadata(json)
    }
    
    /// Parse FFprobe JSON output into MediaMetadata
    fn parse_metadata(&self, json: Value) -> Result<MediaMetadata, String> {
        // Extract video stream info
        let streams = json["streams"].as_array()
            .ok_or("No streams found")?;
        
        let video_stream = streams.iter()
            .find(|s| s["codec_type"].as_str() == Some("video"))
            .ok_or("No video stream found")?;
        
        let duration = json["format"]["duration"]
            .as_str()
            .and_then(|s| s.parse::<f64>().ok())
            .ok_or("Failed to parse duration")?;
        
        let width = video_stream["width"]
            .as_u64()
            .ok_or("Failed to parse width")? as u32;
        
        let height = video_stream["height"]
            .as_u64()
            .ok_or("Failed to parse height")? as u32;
        
        let fps_str = video_stream["r_frame_rate"].as_str()
            .ok_or("Failed to get frame rate")?;
        let fps = self.parse_fps(fps_str)?;
        
        let codec = video_stream["codec_name"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
        
        let bitrate = json["format"]["bit_rate"]
            .as_str()
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);
        
        let file_size = json["format"]["size"]
            .as_str()
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);
        
        Ok(MediaMetadata {
            duration,
            width,
            height,
            fps,
            codec,
            bitrate,
            file_size,
        })
    }
    
    /// Parse FPS string (handles fractional rates like "30000/1001")
    fn parse_fps(&self, fps_str: &str) -> Result<f64, String> {
        let parts: Vec<&str> = fps_str.split('/').collect();
        if parts.len() == 2 {
            let num = parts[0].parse::<f64>()
                .map_err(|_| "Invalid FPS numerator")?;
            let den = parts[1].parse::<f64>()
                .map_err(|_| "Invalid FPS denominator")?;
            if den == 0.0 {
                return Err("FPS denominator cannot be zero".to_string());
            }
            Ok(num / den)
        } else {
            fps_str.parse::<f64>()
                .map_err(|_| format!("Invalid FPS format: {}", fps_str))
        }
    }
    
    /// Generate a thumbnail at a specific timestamp
    pub fn generate_thumbnail(
        &self,
        file_path: &str,
        timestamp: f64,
        output_path: &str
    ) -> Result<(), String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-ss", &timestamp.to_string(),
                "-i", file_path,
                "-vframes", "1",
                "-q:v", "2",
                "-f", "image2",
                output_path
            ])
            .output()
            .map_err(|e| format!("FFmpeg execution failed: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Thumbnail generation failed: {}", stderr));
        }
        
        Ok(())
    }
    
    /// Export video with clips and settings
    pub fn export_video(
        &self,
        clips: &[ClipInfo],
        output_path: &str,
        resolution: &str,
        fps: u32,
        composition_length: f64
    ) -> Result<(), String> {
        if clips.is_empty() {
            return Err("No clips to export".to_string());
        }
        
        // Create FFmpeg filter complex for concatenation and trimming
        let filter_complex = self.build_filter_complex(clips, resolution, fps, composition_length)?;
        
        let mut args = vec![
            "-y".to_string(), // Overwrite output
        ];
        
        // Add input files
        for clip in clips {
            args.push("-i".to_string());
            args.push(clip.file_path.clone());
        }
        
        // Add filter complex
        args.push("-filter_complex".to_string());
        args.push(filter_complex);
        
        // Output settings
        args.extend_from_slice(&[
            "-map".to_string(),
            "[outv]".to_string(),
            "-r".to_string(),
            fps.to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "medium".to_string(),
            "-crf".to_string(),
            "23".to_string(),
            output_path.to_string(),
        ]);
        
        let output = Command::new(&self.ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("FFmpeg execution failed: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Video export failed: {}", stderr));
        }
        
        Ok(())
    }
    
    /// Build FFmpeg filter complex for concatenation with gap handling
    fn build_filter_complex(
        &self,
        clips: &[ClipInfo],
        resolution: &str,
        fps: u32,
        composition_length: f64
    ) -> Result<String, String> {
        let scale = match resolution {
            "720p" => "1280:720",
            "1080p" => "1920:1080",
            "source" => "-1:-1",
            _ => return Err(format!("Invalid resolution: {}", resolution)),
        };
        
        let mut filters = Vec::new();
        let mut video_indices = Vec::new();
        let mut current_time = 0.0;
        
        // Build segments with gaps
        for (i, clip) in clips.iter().enumerate() {
            // Check if there's a gap before this clip
            if clip.start_time > current_time {
                let gap_duration = clip.start_time - current_time;
                
                // Create a black gap segment
                let gap_filter = format!(
                    "color=c=black:s=1920x1080:d={}:r={},scale={}[gap{}]",
                    gap_duration,
                    fps,
                    scale,
                    i
                );
                filters.push(gap_filter);
                video_indices.push(format!("[gap{}]", i));
            }
            
            // Add the actual clip
            let trim_filter = format!(
                "[{}:v]trim=start={}:duration={},setpts=PTS-STARTPTS,scale={}[clip{}]",
                i,
                clip.trim_start,
                clip.duration,
                scale,
                i
            );
            filters.push(trim_filter);
            video_indices.push(format!("[clip{}]", i));
            
            current_time = clip.start_time + clip.duration;
        }
        
        // Add gap to fill to composition length if needed
        if current_time < composition_length {
            let gap_duration = composition_length - current_time;
            let gap_index = clips.len();
            
            let gap_filter = format!(
                "color=c=black:s=1920x1080:d={}:r={},scale={}[gap{}]",
                gap_duration,
                fps,
                scale,
                gap_index
            );
            filters.push(gap_filter);
            video_indices.push(format!("[gap{}]", gap_index));
        }
        
        // Concatenate all segments (gaps + clips + end gap)
        let concat_inputs: String = video_indices.join("");
        
        filters.push(format!(
            "{}concat=n={}:v=1:a=0[outv]",
            concat_inputs,
            video_indices.len()
        ));
        
        Ok(filters.join(";"))
    }
}

