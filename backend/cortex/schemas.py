from pydantic import BaseModel
from typing import Literal, Optional, List

class ActionStep(BaseModel):
    id: int
    action_type: Literal["CLICK", "TYPE", "WAIT", "SCROLL", "NAVIGATE"]
    description: str 
    value: Optional[str] = None
    cached_selector: Optional[str] = None 

class ExecutionPlan(BaseModel):
    steps: List[ActionStep]
