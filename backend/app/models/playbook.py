"""
Playbook Data Models
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime


class PlaybookStatus(str, Enum):
    """Playbook execution status."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class PlaybookAction(BaseModel):
    """Individual action within a playbook."""
    action_id: str
    action_type: str  # block_ip, update_waf, rotate_credentials, etc.
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: int = 30


class Playbook(BaseModel):
    """Automated response playbook."""
    id: str
    name: str
    description: str
    trigger_conditions: Dict[str, Any]
    actions: List[PlaybookAction]
    auto_execute: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PlaybookExecution(BaseModel):
    """Record of a playbook execution."""
    execution_id: str
    playbook_id: str
    threat_id: str
    status: PlaybookStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    actions_executed: List[str] = Field(default_factory=list)
    actions_failed: List[str] = Field(default_factory=list)
    error_message: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PlaybookExecuteRequest(BaseModel):
    """Request to execute a playbook."""
    playbook_id: str
    threat_id: str
    override_params: Optional[Dict[str, Any]] = None


class MitigationRequest(BaseModel):
    """Request to execute all mitigations for a threat."""
    threat_id: str
    analyst_id: Optional[str] = None
