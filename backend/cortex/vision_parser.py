"""
Vision Parser - Analyzes video to extract ActionPlan via Gemini 1.5 Pro.

This module processes uploaded videos and uses Gemini's multimodal
capabilities to understand user actions and generate a structured
execution plan.
"""
import json
import google.generativeai as genai
from pathlib import Path

from cortex.schemas import ActionStep, ExecutionPlan
from config import get_settings


# Configure Gemini
settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)

# System prompt for video analysis
VISION_PROMPT = """You are Dooley, a visual autonomous browser agent. 
Analyze this video recording of a user performing a browser task.

Extract each discrete user action and output a JSON execution plan.

## Action Types
- NAVIGATE: Go to a URL
- CLICK: Click on an element (describe the element visually)
- TYPE: Type text into a field (include the text value)
- SCROLL: Scroll the page (direction: up/down)
- WAIT: Wait for an element or condition

## Output Format
Return ONLY valid JSON in this exact format:
{
  "steps": [
    {"id": 1, "action_type": "NAVIGATE", "description": "Go to login page", "value": "https://example.com/login"},
    {"id": 2, "action_type": "CLICK", "description": "Click the email input field", "value": null},
    {"id": 3, "action_type": "TYPE", "description": "Enter email address", "value": "user@example.com"},
    {"id": 4, "action_type": "CLICK", "description": "Click the blue Sign In button", "value": null},
    {"id": 5, "action_type": "WAIT", "description": "Wait for dashboard to load", "value": "Dashboard"}
  ]
}

Be specific in descriptions - mention colors, positions, and text labels.
Include every user action you observe in chronological order.
"""


async def parse_video(video_path: str | Path) -> ExecutionPlan:
    """
    Analyze a video file and extract an execution plan.
    
    Args:
        video_path: Path to the video file (MP4, WebM, etc.)
        
    Returns:
        ExecutionPlan with extracted steps
    """
    video_path = Path(video_path)
    
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")
    
    # Upload video to Gemini
    video_file = genai.upload_file(str(video_path))
    
    # Wait for processing
    import time
    while video_file.state.name == "PROCESSING":
        time.sleep(2)
        video_file = genai.get_file(video_file.name)
    
    if video_file.state.name == "FAILED":
        raise RuntimeError(f"Video processing failed: {video_file.state.name}")
    
    # Create model and analyze
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    response = model.generate_content(
        [video_file, VISION_PROMPT],
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json"
        )
    )
    
    # Parse response
    result_text = response.text.strip()
    
    # Handle potential markdown code blocks
    if result_text.startswith("```"):
        lines = result_text.split("\n")
        result_text = "\n".join(lines[1:-1])
    
    data = json.loads(result_text)
    
    # Validate and create ExecutionPlan
    steps = [ActionStep(**step) for step in data["steps"]]
    
    return ExecutionPlan(steps=steps)


async def parse_video_from_url(video_url: str, output_dir: str | Path) -> ExecutionPlan:
    """
    Download a video from URL and parse it.
    
    Args:
        video_url: URL of the video (YouTube, direct link, etc.)
        output_dir: Directory to save downloaded video
        
    Returns:
        ExecutionPlan with extracted steps
    """
    import sys
    import subprocess
    import glob
    
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Clean up any existing downloaded files
    for old_file in output_dir.glob("downloaded_video*"):
        old_file.unlink()
    
    output_template = str(output_dir / "downloaded_video.%(ext)s")
    
    # Use Python to run yt-dlp module (works cross-platform)
    # Use 'best' format for simpler single-file download
    cmd = [
        sys.executable,  # Current Python interpreter
        "-m", "yt_dlp",
        "-f", "best[ext=mp4]/best",
        "-o", output_template,
        "--no-playlist",
        video_url
    ]
    
    print(f"📥 Downloading video...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise RuntimeError(f"Failed to download video: {result.stderr}")
    
    # Find the downloaded file
    downloaded_files = list(output_dir.glob("downloaded_video.*"))
    if not downloaded_files:
        raise FileNotFoundError(f"No downloaded file found in {output_dir}")
    
    output_path = downloaded_files[0]
    print(f"✅ Downloaded to: {output_path}")
    
    return await parse_video(output_path)

