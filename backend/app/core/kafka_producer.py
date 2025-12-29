"""
Kafka Producer for ThreatStream
Publishes analyzed threats to Confluent Cloud
"""
import json
from typing import Dict, Any
from confluent_kafka import Producer
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ThreatStreamProducer:
    """Kafka producer for publishing analyzed threats."""

    def __init__(self):
        config = settings.kafka_producer_config

        try:
            self.producer = Producer(config)
            logger.info("Kafka producer initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka producer: {e}")
            self.producer = None

    def _delivery_callback(self, err, msg):
        """Callback for message delivery confirmation."""
        if err:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    def produce_threat(self, threat_data: Dict[str, Any], topic: str = None):
        """
        Publish an analyzed threat to Kafka.

        Args:
            threat_data: Threat data dictionary
            topic: Optional topic override
        """
        if not self.producer:
            logger.warning("Kafka producer not available")
            return

        topic = topic or settings.kafka_analyzed_topic

        try:
            # Serialize to JSON
            message = json.dumps(threat_data, default=str)

            # Produce message
            self.producer.produce(
                topic=topic,
                value=message.encode('utf-8'),
                callback=self._delivery_callback
            )

            # Trigger delivery callbacks
            self.producer.poll(0)

        except Exception as e:
            logger.error(f"Failed to produce message: {e}")

    def produce_alert(self, alert_data: Dict[str, Any]):
        """Publish a critical alert to Kafka."""
        self.produce_threat(alert_data, settings.kafka_alerts_topic)

    def produce_metrics(self, metrics_data: Dict[str, Any]):
        """Publish system metrics to Kafka."""
        self.produce_threat(metrics_data, settings.kafka_metrics_topic)

    def produce_risk_index(self, risk_data: Dict[str, Any]):
        """
        Publish risk index snapshot to Kafka.

        Enables:
        - Historical risk timeline analysis
        - Replay for demos
        - Anomaly detection on risk trends
        - Audit trail for risk changes

        Args:
            risk_data: Risk index data with timestamp, value, level, trend
        """
        self.produce_threat(risk_data, settings.kafka_risk_index_topic)

    def flush(self):
        """Flush any pending messages."""
        if self.producer:
            self.producer.flush()


# Global producer instance
_producer = None


def get_producer() -> ThreatStreamProducer:
    """Get the global producer instance."""
    global _producer
    if _producer is None:
        _producer = ThreatStreamProducer()
    return _producer
