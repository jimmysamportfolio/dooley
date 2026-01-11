"""
API Routes - Defines /analyze and /execute endpoints.

Endpoints:
    POST /api/analyze - Upload video, returns ActionPlan
    POST /api/execute - Execute ActionPlan, streams SSE logs
"""
import asyncio
import uuid
from pathlib import Path
from typing import Dict

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
import aiofiles

from cortex.schemas import ExecutionPlan, ActionStep
from cortex.vision_parser import parse_video
from cortex.navigator import Navigator, NavigatorCallback
from api.sse import ExecutionStream
from config import get_settings


router = APIRouter(prefix="/api", tags=["execution"])
settings = get_settings()

# Store active execution streams
active_streams: Dict[str, ExecutionStream] = {}


class SSENavigatorCallback(NavigatorCallback):
    """Callback that sends events to an SSE stream."""
    
    def __init__(self, stream: ExecutionStream):
        self.stream = stream
    
    async def on_step_start(self, step: ActionStep) -> None:
        await self.stream.send_action(step.id, "running")
        await self.stream.send_log(
            f"Step {step.id}: {step.action_type} - {step.description}"
        )
    
    async def on_step_complete(self, step: ActionStep, screenshot_b64: str) -> None:
        await self.stream.send_action(step.id, "complete", screenshot_b64)
    
    async def on_step_error(self, step: ActionStep, error: str) -> None:
        await self.stream.send_action(step.id, "error")
        await self.stream.send_log(f"Error: {error}", "error")
    
    async def on_log(self, message: str, level: str = "info") -> None:
        await self.stream.send_log(message, level)


@router.post("/analyze")
async def analyze_video(video: UploadFile = File(...)) -> ExecutionPlan:
    """
    Upload a video file and get back an ActionPlan.
    
    Accepts: MP4, WebM, MOV (30s-60s recommended)
    Returns: ExecutionPlan with extracted steps
    """
    # Validate file type
    allowed_types = ["video/mp4", "video/webm", "video/quicktime"]
    if video.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )
    
    # Save video to temp directory
    temp_dir = Path(settings.temp_dir)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    video_id = str(uuid.uuid4())
    video_path = temp_dir / f"{video_id}.mp4"
    
    async with aiofiles.open(video_path, "wb") as f:
        content = await video.read()
        await f.write(content)
    
    try:
        # Analyze video with Gemini
        plan = await parse_video(video_path)
        return plan
    finally:
        # Clean up temp file
        video_path.unlink(missing_ok=True)


@router.post("/execute/{execution_id}")
async def execute_plan(
    execution_id: str,
    plan: ExecutionPlan,
    background_tasks: BackgroundTasks
) -> dict:
    """
    Start executing an ActionPlan.
    
    Returns immediately with the execution_id.
    Connect to /api/execute/{execution_id}/stream for SSE updates.
    """
    if execution_id in active_streams:
        raise HTTPException(
            status_code=400,
            detail=f"Execution {execution_id} already in progress"
        )
    
    # Create SSE stream
    stream = ExecutionStream()
    active_streams[execution_id] = stream
    
    # Run execution in background
    background_tasks.add_task(
        run_execution,
        execution_id,
        plan,
        stream
    )
    
    return {
        "execution_id": execution_id,
        "status": "started",
        "stream_url": f"/api/execute/{execution_id}/stream"
    }


async def run_execution(
    execution_id: str,
    plan: ExecutionPlan,
    stream: ExecutionStream
) -> None:
    """Background task that runs the execution."""
    callback = SSENavigatorCallback(stream)
    nav = Navigator(callback=callback, headless=settings.headless)
    
    try:
        await nav.start()
        await nav.execute_plan(plan)
        await stream.send_log("Execution complete!", "success")
    except Exception as e:
        await stream.send_log(f"Execution failed: {e}", "error")
    finally:
        await nav.stop()
        await stream.close()
        # Clean up stream after a delay
        await asyncio.sleep(5)
        active_streams.pop(execution_id, None)


@router.get("/execute/{execution_id}/stream")
async def stream_execution(execution_id: str) -> StreamingResponse:
    """
    SSE stream for execution updates.
    
    Connect to this endpoint to receive real-time logs and screenshots.
    """
    if execution_id not in active_streams:
        raise HTTPException(
            status_code=404,
            detail=f"Execution {execution_id} not found"
        )
    
    stream = active_streams[execution_id]
    
    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/executions")
async def list_executions() -> dict:
    """List active executions."""
    return {
        "active": list(active_streams.keys()),
        "count": len(active_streams)
    }
