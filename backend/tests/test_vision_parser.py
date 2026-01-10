"""
Test harness for Vision Parser.

Run this script to test video analysis with a YouTube URL or local file.

Usage:
    python -m tests.test_vision_parser --url "https://youtube.com/watch?v=..."
    python -m tests.test_vision_parser --file "./path/to/video.mp4"
"""
import argparse
import asyncio
import json
from pathlib import Path
import sys

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from cortex.vision_parser import parse_video, parse_video_from_url


async def main():
    parser = argparse.ArgumentParser(description="Test Dooley Vision Parser")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--url", help="YouTube or video URL to analyze")
    group.add_argument("--file", help="Local video file to analyze")
    parser.add_argument(
        "--output", 
        default="./tests/output",
        help="Output directory for results (default: ./tests/output)"
    )
    
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("🎬 DOOLEY VISION PARSER TEST")
    print("=" * 60)
    
    try:
        if args.url:
            print(f"\n📥 Downloading video from: {args.url}")
            plan = await parse_video_from_url(args.url, output_dir)
        else:
            print(f"\n📂 Analyzing local file: {args.file}")
            plan = await parse_video(args.file)
        
        # Save JSON output
        output_file = output_dir / "execution_plan.json"
        with open(output_file, "w") as f:
            json.dump(plan.model_dump(), f, indent=2)
        
        print(f"\n✅ SUCCESS! Extracted {len(plan.steps)} steps")
        print(f"📄 Output saved to: {output_file}")
        print("\n" + "=" * 60)
        print("EXECUTION PLAN")
        print("=" * 60)
        
        for step in plan.steps:
            icon = {
                "NAVIGATE": "🌐",
                "CLICK": "👆",
                "TYPE": "⌨️",
                "SCROLL": "📜",
                "WAIT": "⏳"
            }.get(step.action_type, "❓")
            
            print(f"\n{icon} Step {step.id}: {step.action_type}")
            print(f"   {step.description}")
            if step.value:
                print(f"   Value: {step.value}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
