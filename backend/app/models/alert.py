"""
Alert Data Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AlertStatus(str, Enum):
    """
    Alert lifecycle status.

    Workflow: NEW → ACKNOWLEDGED → INVESTIGATING → RESOLVED/FALSE_POSITIVE
    """
    NEW = "NEW"                       # Just created, awaiting triage
    ACKNOWLEDGED = "ACKNOWLEDGED"     # Analyst has seen it
    INVESTIGATING = "INVESTIGATING"   # Active investigation in progress
    RESOLVED = "RESOLVED"             # Threat mitigated
    FALSE_POSITIVE = "FALSE_POSITIVE" # Determined to be benign


class AlertPriority(str, Enum):
    """
    Alert priority for SLA tracking.

    P1: Immediate (15 min SLA)
    P2: Urgent (1 hour SLA)
    P3: Medium (4 hour SLA)
    P4: Low (24 hour SLA)
    """
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class Alert(BaseModel):
    """
    Security alert requiring SOC attention.

    Created automatically for CRITICAL and HIGH severity threats.
    """
    id: str
    threat_id: str

    # Alert details
    title: str
    description: str
    severity: str
    priority: AlertPriority
    status: AlertStatus = AlertStatus.NEW

    # Timing
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    # Assignment
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None

    # Metadata
    source_ip: str
    source_country: Optional[str] = None
    mitre_attack_id: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AlertAcknowledge(BaseModel):
    """Request model for acknowledging an alert."""
    analyst_id: str
    notes: Optional[str] = None


class AlertResolve(BaseModel):
    """Request model for resolving an alert."""
    analyst_id: str
    resolution: str  # RESOLVED or FALSE_POSITIVE
    notes: Optional[str] = None
