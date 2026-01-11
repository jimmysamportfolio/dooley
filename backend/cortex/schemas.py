from pydantic import BaseModel
from typing import Literal, Optional, List


class ActionStep(BaseModel):
    """
    Represents a single action in an execution plan.
    
    Attributes:
        id: Step number
        action_type: Type of action (CLICK, TYPE, etc.)
        description: Human-readable description of the action
        value: Value for the action (URL for NAVIGATE, text for TYPE, etc.)
        cached_selector: CSS selector (cached after successful execution)
        semantic_intent: The high-level goal of this step (for fallback recovery)
        alternatives: Alternative ways to achieve this step if primary fails
    """
    id: int
    action_type: Literal["CLICK", "TYPE", "WAIT", "SCROLL", "NAVIGATE"]
    description: str 
    value: Optional[str] = None
    cached_selector: Optional[str] = None
    
    # Semantic context for smarter fallback
    semantic_intent: Optional[str] = None  # e.g., "view list of available agents"
    alternatives: Optional[List[str]] = None  # e.g., ["click 'Browse All'", "scroll to see more options"]
    
    # Visual grounding
    timestamp: Optional[str] = None  # e.g., "00:15"
    visual_context: Optional[str] = None  # Base64 encoded crop/frame of what to click


class ExecutionPlan(BaseModel):
    """
    Complete execution plan extracted from video analysis.
    
    Attributes:
        steps: List of ActionStep objects in execution order
        source_url: The starting URL detected in the video (if any)
    """
    steps: List[ActionStep]
    source_url: Optional[str] = None  # Detected starting URL from video
