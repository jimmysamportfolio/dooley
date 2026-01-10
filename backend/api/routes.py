"""
API Routes - Defines /analyze and /execute endpoints.

Endpoints:
    POST /api/analyze - Upload video, returns ActionPlan
    POST /api/execute - Execute ActionPlan, returns SSE stream
    GET  /api/execute/{id}/stream - SSE connection for execution logs
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["execution"])

# TODO: Implement /analyze endpoint
# TODO: Implement /execute endpoint
# TODO: Implement /execute/{id}/stream endpoint
