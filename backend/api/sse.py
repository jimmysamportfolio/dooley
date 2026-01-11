"""
SSE Utilities - Server-Sent Events streaming helpers.

Provides utilities for streaming real-time execution logs to the frontend.
"""
from typing import AsyncGenerator
import asyncio
import json


async def event_generator(
    event_type: str,
    data: dict
) -> str:
    """Format data as SSE event string."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


class ExecutionStream:
    """
    Manages SSE streaming for a single execution session.
    
    Usage:
        stream = ExecutionStream()
        await stream.send_log("Starting execution...")
        await stream.send_action(step_id=1, status="running")
    """
    
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self.is_active: bool = True
    
    async def send_log(self, message: str, level: str = "info") -> None:
        """Send a log message to the stream."""
        await self.queue.put({
            "type": "log",
            "level": level,
            "message": message
        })
    
    async def send_action(
        self,
        step_id: int,
        status: str,
        screenshot_b64: str | None = None
    ) -> None:
        """Send an action status update."""
        await self.queue.put({
            "type": "action",
            "step_id": step_id,
            "status": status,
            "screenshot": screenshot_b64
        })
    
    async def close(self) -> None:
        """Close the stream."""
        self.is_active = False
        await self.queue.put(None)
    
    async def __aiter__(self) -> AsyncGenerator[str, None]:
        """Iterate over stream events."""
        while self.is_active:
            data = await self.queue.get()
            if data is None:
                break
            yield await event_generator("message", data)
