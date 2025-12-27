"""
Analytics Data Models
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class DashboardStats(BaseModel):
    """Real-time dashboard statistics."""
    processed: int = Field(description="Total events processed")
    blocked: int = Field(description="Events blocked")
    critical: int = Field(description="Critical threats detected")
    avg_detect_time: int = Field(description="Average detection time in ms")
    latency_history: List[int] = Field(description="Historical latency data")


class TimelineData(BaseModel):
    """Risk timeline data point."""
    time: str = Field(description="Timestamp (HH:MM:SS)")
    risk: float = Field(ge=0, le=100, description="Risk score at this time")


class TopSource(BaseModel):
    """Top attacking source statistics."""
    ip: str
    country: str
    country_code: str
    attack_count: int
    severity_distribution: Dict[str, int]
    last_seen: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ThreatDistribution(BaseModel):
    """Distribution of threats by type."""
    threat_type: str
    count: int
    percentage: float


class GeographicThreat(BaseModel):
    """Geographic threat data for globe visualization."""
    country_code: str
    country_name: str
    coordinates: List[float]  # [lat, lng]
    threat_count: int
    severity_level: str
    zone: str  # HOSTILE, EXTERNAL, INTERNAL, TRUSTED


class AnalyticsSummary(BaseModel):
    """Complete analytics summary for dashboard."""
    risk_index: int = Field(ge=0, le=100)
    risk_level: str
    risk_trend: str

    # Counts
    total_events: int
    threats_detected: int
    alerts_generated: int
    events_blocked: int

    # Performance
    avg_detection_time_ms: int
    events_per_second: float

    # Distributions
    severity_distribution: Dict[str, int]
    threat_type_distribution: List[ThreatDistribution]

    # Geographic
    top_sources: List[TopSource]
    geographic_threats: List[GeographicThreat]

    # Timeline
    risk_timeline: List[TimelineData]

    # Last update
    last_updated: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
