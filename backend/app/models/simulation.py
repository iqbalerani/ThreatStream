"""
Simulation Data Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class ScenarioType(str, Enum):
    """Attack simulation scenarios."""
    NORMAL = "normal"
    BRUTE_FORCE = "brute_force"
    SQL_INJECTION = "sql_injection"
    DDOS = "ddos"
    RANSOMWARE = "ransomware"


class SimulationStatus(str, Enum):
    """Simulation status."""
    STOPPED = "STOPPED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"


class SimulationConfig(BaseModel):
    """Configuration for attack simulation."""
    scenario: ScenarioType
    events_per_second: int = Field(ge=1, le=1000, default=10)
    duration_seconds: Optional[int] = None
    target_ips: Optional[List[str]] = None


class SimulationState(BaseModel):
    """Current simulation state."""
    status: SimulationStatus
    scenario: Optional[ScenarioType] = None
    events_generated: int = 0
    duration_seconds: int = 0
    started_at: Optional[datetime] = None
    stopped_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AttackPattern(BaseModel):
    """Definition of an attack pattern."""
    name: str
    event_type: str
    mitre_id: str
    severity: str
    description: str
    source_countries: List[str]
    indicators: List[str]
