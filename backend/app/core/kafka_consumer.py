"""
Kafka Consumer for ThreatStream
Consumes security events from Confluent Cloud
"""
import json
import asyncio
from typing import Callable, List
from confluent_kafka import Consumer, KafkaError
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ThreatStreamConsumer:
    """Kafka consumer for security events."""

    def __init__(self, topic: str, group_id: str):
        self.topic = topic
        self.group_id = group_id
        self._handlers: List[Callable] = []
        self._running = False

        # Initialize consumer
        config = settings.kafka_config
        config["group.id"] = group_id

        try:
            self.consumer = Consumer(config)
            self.consumer.subscribe([topic])
            logger.info(f"Kafka consumer initialized for topic: {topic}")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka consumer: {e}")
            # Create a dummy consumer for development without Kafka
            self.consumer = None

    def add_handler(self, handler: Callable):
        """Add a message handler."""
        self._handlers.append(handler)

    async def start(self):
        """Start consuming messages."""
        if not self.consumer:
            logger.warning("Kafka consumer not available - running in simulation mode")
            return

        self._running = True
        logger.info(f"Starting Kafka consumer for topic: {self.topic}")

        while self._running:
            try:
                # Poll for messages
                msg = await asyncio.to_thread(self.consumer.poll, 1.0)

                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Consumer error: {msg.error()}")
                        continue

                # Deserialize message
                try:
                    event_data = json.loads(msg.value().decode('utf-8'))

                    # Process with all handlers
                    for handler in self._handlers:
                        try:
                            await handler(event_data)
                        except Exception as e:
                            logger.error(f"Handler error: {e}")

                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode message: {e}")

            except Exception as e:
                logger.error(f"Consumer loop error: {e}")
                await asyncio.sleep(1)

    def stop(self):
        """Stop consuming messages."""
        self._running = False
        if self.consumer:
            self.consumer.close()
        logger.info("Kafka consumer stopped")
