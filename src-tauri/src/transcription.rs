// Transcription Module
//
// Handles AI-powered transcription using OpenAI Whisper API.
// Provides audio extraction, API integration, and transcript export functionality.

use serde::{Deserialize, Serialize};
use std::path::Path;
use reqwest::multipart;
use chrono::Utc;

// Public data structures

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptSegment {
    pub id: String,
    pub text: String,
    pub start: f64,
    pub end: f64,
    pub confidence: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptWord {
    pub word: String,
    pub start: f64,
    pub end: f64,
    pub confidence: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transcript {
    pub id: String,
    #[serde(rename = "clipId")]
    pub clip_id: String,
    pub language: String,
    pub segments: Vec<TranscriptSegment>,
    pub words: Vec<TranscriptWord>,
    #[serde(rename = "fullText")]
    pub full_text: String,
    pub duration: f64,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionProgress {
    #[serde(rename = "clipId")]
    pub clip_id: String,
    pub stage: String,
    pub percent: f64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionConfig {
    pub language: Option<String>,
    pub model: String, // "whisper-1"
    #[serde(rename = "responseFormat")]
    pub response_format: String, // "verbose_json"
    pub temperature: f64,
}

// Internal API response structures

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct WhisperResponse {
    task: String,
    language: String,
    duration: f64,
    text: String,
    segments: Vec<WhisperSegment>,
    words: Option<Vec<WhisperWord>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct WhisperSegment {
    id: i32,
    seek: i32,
    start: f64,
    end: f64,
    text: String,
    temperature: f64,
    avg_logprob: f64,
    compression_ratio: f64,
    no_speech_prob: f64,
}

#[derive(Debug, Serialize, Deserialize)]
struct WhisperWord {
    word: String,
    start: f64,
    end: f64,
}

// OpenAI API Client

pub struct OpenAIClient {
    api_key: String,
    client: reqwest::Client,
    base_url: String,
}

impl OpenAIClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
            base_url: "https://api.openai.com/v1".to_string(),
        }
    }

    pub async fn transcribe(
        &self,
        audio_path: &Path,
        config: &TranscriptionConfig,
    ) -> Result<WhisperResponse, String> {
        // Read audio file
        let file_bytes = tokio::fs::read(audio_path)
            .await
            .map_err(|e| format!("Failed to read audio file: {}", e))?;

        let file_name = audio_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("audio.mp3");

        // Build multipart form
        let file_part = multipart::Part::bytes(file_bytes)
            .file_name(file_name.to_string())
            .mime_str("audio/mpeg")
            .map_err(|e| format!("Failed to create file part: {}", e))?;

        let mut form = multipart::Form::new()
            .part("file", file_part)
            .text("model", config.model.clone())
            .text("response_format", config.response_format.clone())
            .text("temperature", config.temperature.to_string());

        if let Some(lang) = &config.language {
            form = form.text("language", lang.clone());
        }

        // Make API request
        let response = self
            .client
            .post(format!("{}/audio/transcriptions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API error {}: {}", status, body));
        }

        let whisper_response: WhisperResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(whisper_response)
    }
}

// Export helper functions

/// Convert WhisperResponse to our Transcript format
pub fn whisper_to_transcript(
    whisper: WhisperResponse,
    clip_id: String,
) -> Transcript {
    let segments: Vec<TranscriptSegment> = whisper
        .segments
        .iter()
        .map(|s| TranscriptSegment {
            id: uuid::Uuid::new_v4().to_string(),
            text: s.text.trim().to_string(),
            start: s.start,
            end: s.end,
            confidence: None, // Whisper doesn't provide per-segment confidence
        })
        .collect();

    let words: Vec<TranscriptWord> = whisper
        .words
        .unwrap_or_default()
        .iter()
        .map(|w| TranscriptWord {
            word: w.word.clone(),
            start: w.start,
            end: w.end,
            confidence: None,
        })
        .collect();

    Transcript {
        id: uuid::Uuid::new_v4().to_string(),
        clip_id,
        language: whisper.language,
        segments,
        words,
        full_text: whisper.text,
        duration: whisper.duration,
        created_at: Utc::now().to_rfc3339(),
    }
}

/// Export transcript to TXT format
pub async fn export_as_txt(transcript: &Transcript, path: &str) -> Result<(), String> {
    tokio::fs::write(path, &transcript.full_text)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Export transcript to SRT format
pub async fn export_as_srt(transcript: &Transcript, path: &str) -> Result<(), String> {
    let mut srt = String::new();
    for (i, segment) in transcript.segments.iter().enumerate() {
        srt.push_str(&format!("{}\n", i + 1));
        srt.push_str(&format!(
            "{} --> {}\n",
            format_srt_time(segment.start),
            format_srt_time(segment.end)
        ));
        srt.push_str(&format!("{}\n\n", segment.text));
    }
    tokio::fs::write(path, srt)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Export transcript to VTT format
pub async fn export_as_vtt(transcript: &Transcript, path: &str) -> Result<(), String> {
    let mut vtt = String::from("WEBVTT\n\n");
    for segment in &transcript.segments {
        vtt.push_str(&format!(
            "{} --> {}\n",
            format_vtt_time(segment.start),
            format_vtt_time(segment.end)
        ));
        vtt.push_str(&format!("{}\n\n", segment.text));
    }
    tokio::fs::write(path, vtt)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Export transcript to JSON format
pub async fn export_as_json(transcript: &Transcript, path: &str) -> Result<(), String> {
    let json = serde_json::to_string_pretty(transcript)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    tokio::fs::write(path, json)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

// Time formatting helpers

fn format_srt_time(seconds: f64) -> String {
    let hours = (seconds / 3600.0).floor() as i32;
    let minutes = ((seconds % 3600.0) / 60.0).floor() as i32;
    let secs = (seconds % 60.0).floor() as i32;
    let millis = ((seconds % 1.0) * 1000.0).floor() as i32;
    format!("{:02}:{:02}:{:02},{:03}", hours, minutes, secs, millis)
}

fn format_vtt_time(seconds: f64) -> String {
    let hours = (seconds / 3600.0).floor() as i32;
    let minutes = ((seconds % 3600.0) / 60.0).floor() as i32;
    let secs = (seconds % 60.0).floor() as i32;
    let millis = ((seconds % 1.0) * 1000.0).floor() as i32;
    format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, secs, millis)
}

