"""
Vision Parser - Analyzes video to extract ActionPlan via Gemini 1.5 Pro.

This module processes uploaded videos and uses Gemini's multimodal
capabilities to understand user actions and generate a structured
execution plan.
"""
import json
import time
from pathlib import Path
from google import genai
from google.genai import types
import cv2
import base64

from cortex.schemas import ActionStep, ExecutionPlan
from config import get_settings


# Configure Gemini
settings = get_settings()
client = genai.Client(api_key=settings.gemini_api_key)

# System prompt for video analysis
VISION_PROMPT = """You are Dooley, a visual autonomous browser agent. 
Analyze this video recording of a user performing a browser task.

Extract each discrete user action and output a JSON execution plan.

## CRITICAL RULES
1. The FIRST step MUST ALWAYS be a NAVIGATE action with the starting URL you see in the browser
2. Look at the URL bar in the video to identify the starting website
3. If you see google.com or a search page, start with NAVIGATE to https://www.google.com
4. Include semantic_intent for EVERY step - this describes the high-level goal
5. IMPORTANT: If user types in a SEARCH BOX and then results appear, they pressed ENTER - add \\n to the value!
6. IMPORTANT: Watch for page changes after typing - if the page changes, Enter was pressed!

## Action Types
- NAVIGATE: Go to a URL (MUST be first step!)
- CLICK: Click on an element (describe the element visually, include text label in value)
- TYPE: Type text into a field. ALWAYS add \\n at the end if:
  * The user is typing in a SEARCH box (Google, GitHub, etc.)
  * The page changes/updates after typing
  * The user presses Enter (even if you can't see the keypress)
  * IMPORTANT: If the user makes a typo and corrects it, output ONLY the FINAL INTENDED TEXT. Ignore the backspaces/corrections.
  * Example: User types "git", backspaces, types "github" -> Value should be "github".
- SCROLL: Scroll the page (direction: up/down)
- WAIT: Wait for an element or condition

## Output Format
Return ONLY valid JSON in this exact format:
{
  "source_url": "https://www.google.com",
  "steps": [
    {
      "id": 1, 
      "action_type": "NAVIGATE", 
      "description": "Go to Google", 
      "value": "https://www.google.com",
      "semantic_intent": "Start at the search engine",
      "timestamp": "00:00",
      "alternatives": null
    },
    {
      "id": 2, 
      "action_type": "TYPE", 
      "description": "Type 'gumloop' in the search bar and press Enter", 
      "value": "gumloop\\n",
      "semantic_intent": "Search for the Gumloop product",
      "timestamp": "00:05",
      "alternatives": ["click search button after typing", "use Google 'I'm Feeling Lucky'"]
    },
    {
      "id": 3, 
      "action_type": "CLICK", 
      "description": "Click on 'Gumloop | AI Automation' search result", 
      "value": "Gumloop | AI Automation",
      "semantic_intent": "Navigate to the Gumloop website from search results",
      "timestamp": "00:10",
      "alternatives": ["click any Gumloop-related link", "look for gumloop.com in URL"]
    }
  ]
}

## timestamp Guidelines
- format: MM:SS
- The exact time in the video when the action STARTS or is clearly visible.


## semantic_intent Guidelines
- Describe WHAT the user is trying to achieve, not HOW
- Think about the purpose/goal of the action
- Use action verbs: "Navigate to...", "Find...", "Select...", "Enter..."

## alternatives Guidelines  
- List 2-3 alternative ways to achieve the same goal
- Think about what else could work if the exact element isn't found
- Consider different button text, layouts, or paths to the same result

## CRITICAL: Be VERY specific in descriptions!
- ALWAYS include POSITION: "top-right corner", "next to the search bar", "in the header", "in the sidebar"
- ALWAYS include VISUAL CUES: colors, icons, text labels
- BAD: "Click the plus button" 
- GOOD: "Click the '+' icon in the top-right header next to the profile picture"
- BAD: "Click New repository"
- GOOD: "Click 'New repository' option in the dropdown menu"

Include every user action you observe in chronological order.
REMEMBER: First step MUST be NAVIGATE! Include semantic_intent for EVERY step!
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
    video_file = client.files.upload(file=str(video_path))
    
    # Wait for processing
    while video_file.state.name == "PROCESSING":
        time.sleep(2)
        video_file = client.files.get(name=video_file.name)
    
    if video_file.state.name == "FAILED":
        raise RuntimeError(f"Video processing failed: {video_file.state.name}")
    
    # Generate content
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[video_file, VISION_PROMPT],
        config=types.GenerateContentConfig(
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
    
    # Post-process to clean up redundant steps
    steps = _post_process_steps(steps)
    
    # Extract frames for context
    steps = _extract_frames(video_path, steps)
    
    return ExecutionPlan(steps=steps)


def _extract_frames(video_path: Path, steps: list[ActionStep]) -> list[ActionStep]:
    """Extract frames from video for each step based on timestamp."""
    cap = cv2.VideoCapture(str(video_path))
    
    if not cap.isOpened():
        print(f"Warning: Could not open video for frame extraction: {video_path}")
        return steps
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    for step in steps:
        if not step.timestamp:
            continue
            
        try:
            # Parse timestamp MM:SS
            parts = step.timestamp.split(':')
            if len(parts) == 2:
                seconds = int(parts[0]) * 60 + int(parts[1])
            else:
                seconds = int(float(step.timestamp))
                
            # Seek to frame
            frame_num = int(seconds * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            
            ret, frame = cap.read()
            if ret:
                # Resize to reduce size (max 1280px width) - 800 was too small for small icons
                height, width = frame.shape[:2]
                if width > 1280:
                    scale = 1280 / width
                    frame = cv2.resize(frame, (int(width * scale), int(height * scale)))
                
                # Encode to base64
                _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                step.visual_context = base64.b64encode(buffer).decode('utf-8')
                
        except Exception as e:
            print(f"Error extracting frame for step {step.id}: {e}")
            
    cap.release()
    return steps


def _post_process_steps(steps: list[ActionStep]) -> list[ActionStep]:
    """
    Clean up the raw steps from Gemini.
    - Merges consecutive TYPE actions (e.g. "git" -> "github")
    """
    if not steps:
        return []
        
    merged = []
    for step in steps:
        if not merged:
            merged.append(step)
            continue
            
        prev = merged[-1]
        
        # Merge consecutive TYPE actions if they seem to be the same input
        if (step.action_type == "TYPE" and prev.action_type == "TYPE"):
            # If values overlap or descriptions are similar
            vals_overlap = prev.value and step.value and (prev.value in step.value or step.value in prev.value)
            
            if vals_overlap:
                # Keep the new one as it's likely the more complete version
                merged[-1] = step
                continue
                
        merged.append(step)
    
    # Re-number IDs
    for i, s in enumerate(merged, 1):
        s.id = i
        
    return merged


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
    
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Clean up any existing downloaded files
    for old_file in output_dir.glob("downloaded_video*"):
        old_file.unlink()
    
    output_template = str(output_dir / "downloaded_video.%(ext)s")
    
    # Use Python to run yt-dlp module (works cross-platform)
    # Use 'best' format that is already mp4, or best available and recode
    # Use Python to run yt-dlp module (works cross-platform)
    # Get best video-only or single file (audio not needed for vision)
    cmd = [
        sys.executable,  # Current Python interpreter
        "-m", "yt_dlp",
        "-f", "bestvideo",
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

