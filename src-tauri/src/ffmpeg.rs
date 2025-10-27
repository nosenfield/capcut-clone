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
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClipInfo {
    pub file_path: String,
    pub start_time: f64,
    pub duration: f64,
    pub trim_start: f64,
    pub trim_end: f64,
}

pub struct FFmpegExecutor {
    ffmpeg_path: PathBuf,
    ffprobe_path: PathBuf,
}

impl FFmpegExecutor {
    /// Creates a new FFmpegExecutor instance with bundled binary paths
    pub fn new() -> Result<Self, String> {
        // For development, use the binaries directory in the project
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
            .map_err(|e| format!("Failed to get manifest dir: {}", e))?;
        let manifest_path = PathBuf::from(manifest_dir);
        
        let binaries_dir = manifest_path.join("binaries");
        let ffmpeg_path = binaries_dir.join("ffmpeg");
        let ffprobe_path = binaries_dir.join("ffprobe");
        
        // Verify binaries exist
        if !ffmpeg_path.exists() {
            return Err(format!("FFmpeg binary not found at: {:?}", ffmpeg_path));
        }
        if !ffprobe_path.exists() {
            return Err(format!("FFprobe binary not found at: {:?}", ffprobe_path));
        }
        
        Ok(Self {
            ffmpeg_path,
            ffprobe_path,
        })
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
        
        Ok(MediaMetadata {
            duration,
            width,
            height,
            fps,
            codec,
            bitrate,
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
        fps: u32
    ) -> Result<(), String> {
        if clips.is_empty() {
            return Err("No clips to export".to_string());
        }
        
        // Create FFmpeg filter complex for concatenation and trimming
        let filter_complex = self.build_filter_complex(clips, resolution)?;
        
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
    
    /// Build FFmpeg filter complex for concatenation
    fn build_filter_complex(
        &self,
        clips: &[ClipInfo],
        resolution: &str
    ) -> Result<String, String> {
        let scale = match resolution {
            "720p" => "1280:720",
            "1080p" => "1920:1080",
            "source" => "-1:-1",
            _ => return Err(format!("Invalid resolution: {}", resolution)),
        };
        
        let mut filters = Vec::new();
        
        // Trim and scale each input
        for (i, clip) in clips.iter().enumerate() {
            let trim_filter = format!(
                "[{}:v]trim=start={}:duration={},setpts=PTS-STARTPTS,scale={}[v{}]",
                i,
                clip.trim_start,
                clip.duration,
                scale,
                i
            );
            filters.push(trim_filter);
        }
        
        // Concatenate all clips
        let concat_inputs: String = (0..clips.len())
            .map(|i| format!("[v{}]", i))
            .collect::<Vec<_>>()
            .join("");
        
        filters.push(format!(
            "{}concat=n={}:v=1:a=0[outv]",
            concat_inputs,
            clips.len()
        ));
        
        Ok(filters.join(";"))
    }
}

