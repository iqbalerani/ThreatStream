"""
ThreatStream Configuration Management
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with validation."""

    # Application
    environment: str = Field(default="development")
    debug: bool = Field(default=False)
    api_host: str = Field(default="0.0.0.0")
    api_port: int = Field(default=8000)
    log_level: str = Field(default="INFO")

    # Confluent Cloud
    confluent_bootstrap_servers: str = Field(default="")
    confluent_api_key: str = Field(default="")
    confluent_api_secret: str = Field(default="")
    confluent_cluster_id: str = Field(default="")

    # Kafka Topics
    kafka_raw_topic: str = Field(default="security.raw.logs")
    kafka_analyzed_topic: str = Field(default="security.analyzed.threats")
    kafka_alerts_topic: str = Field(default="security.critical.alerts")
    kafka_metrics_topic: str = Field(default="security.system.metrics")
    kafka_risk_index_topic: str = Field(default="risk_index")
    kafka_consumer_group: str = Field(default="threatstream-processor-group")
    kafka_auto_offset_reset: str = Field(default="latest")
    kafka_enable_auto_commit: bool = Field(default=False)

    # Google Cloud
    google_cloud_project: str = Field(default="")
    google_application_credentials: str = Field(default="")
    gcp_region: str = Field(default="us-central1")

    # Vertex AI (Gemini via Google Cloud)
    gemini_model: str = Field(default="gemini-1.5-flash")
    gemini_temperature: float = Field(default=0.1)
    gemini_max_tokens: int = Field(default=2048)
    gemini_rate_limit: int = Field(default=60)

    # Firestore Collections
    firestore_database: str = Field(default="(default)")
    firestore_collection_threats: str = Field(default="threats")
    firestore_collection_alerts: str = Field(default="alerts")
    firestore_collection_analytics: str = Field(default="analytics")
    firestore_collection_playbooks: str = Field(default="playbooks")

    # CORS
    cors_origins: str = Field(default="http://localhost:3000")

    # Rate Limiting
    rate_limit_requests: int = Field(default=1000)
    rate_limit_window: int = Field(default=60)

    # WebSocket
    ws_heartbeat_interval: int = Field(default=30)
    ws_max_connections: int = Field(default=1000)

    # Performance
    threat_batch_size: int = Field(default=100)
    threat_processing_interval: float = Field(default=0.1)
    ai_analysis_threshold: str = Field(default="MEDIUM")

    # Risk Index Publishing
    risk_change_threshold: int = Field(default=1)  # Minimum change to publish
    risk_heartbeat_interval: int = Field(default=10)  # Seconds between heartbeats

    # Simulation
    simulation_enabled: bool = Field(default=True)
    simulation_max_eps: int = Field(default=500)

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def kafka_config(self) -> dict:
        """Get Kafka connection configuration."""
        config = {
            "bootstrap.servers": self.confluent_bootstrap_servers,
            "group.id": self.kafka_consumer_group,
            "auto.offset.reset": self.kafka_auto_offset_reset,
            "enable.auto.commit": self.kafka_enable_auto_commit,
        }

        # Add authentication if credentials provided
        if self.confluent_api_key and self.confluent_api_secret:
            config.update({
                "security.protocol": "SASL_SSL",
                "sasl.mechanisms": "PLAIN",
                "sasl.username": self.confluent_api_key,
                "sasl.password": self.confluent_api_secret,
            })

        return config

    @property
    def kafka_producer_config(self) -> dict:
        """Get Kafka producer configuration."""
        config = {
            "bootstrap.servers": self.confluent_bootstrap_servers,
        }

        # Add authentication if credentials provided
        if self.confluent_api_key and self.confluent_api_secret:
            config.update({
                "security.protocol": "SASL_SSL",
                "sasl.mechanisms": "PLAIN",
                "sasl.username": self.confluent_api_key,
                "sasl.password": self.confluent_api_secret,
            })

        return config

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
