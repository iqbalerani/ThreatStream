"""
Playbook Service - Automated response execution
"""
import uuid
from datetime import datetime
from typing import Dict, List
from app.models.playbook import Playbook, PlaybookExecution, PlaybookStatus, PlaybookAction
from app.models.threat import Threat
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PlaybookService:
    """Service for automated response playbook execution."""

    def __init__(self):
        self.playbooks = self._initialize_playbooks()
        self.executions: List[Dict] = []
        logger.info("PlaybookService initialized")

    def _initialize_playbooks(self) -> Dict[str, Playbook]:
        """Initialize default playbooks."""
        return {
            "pb-brute-001": Playbook(
                id="pb-brute-001",
                name="Brute Force Mitigation",
                description="Automated response to brute force attacks",
                trigger_conditions={"threat_type": "BRUTE_FORCE", "min_severity": "HIGH"},
                actions=[
                    PlaybookAction(
                        action_id="1",
                        action_type="block_ip",
                        description="Block source IP at firewall",
                        parameters={}
                    ),
                    PlaybookAction(
                        action_id="2",
                        action_type="rotate_credentials",
                        description="Force password reset for targeted accounts",
                        parameters={}
                    )
                ],
                auto_execute=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            "pb-ddos-001": Playbook(
                id="pb-ddos-001",
                name="DDoS Protection",
                description="Activate DDoS protection measures",
                trigger_conditions={"threat_type": "DDOS_ATTACK", "min_severity": "CRITICAL"},
                actions=[
                    PlaybookAction(
                        action_id="1",
                        action_type="enable_rate_limiting",
                        description="Enable aggressive rate limiting",
                        parameters={"rate_limit": 10}
                    ),
                    PlaybookAction(
                        action_id="2",
                        action_type="block_ip_range",
                        description="Block attacking IP range",
                        parameters={}
                    )
                ],
                auto_execute=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            "pb-sql-001": Playbook(
                id="pb-sql-001",
                name="SQL Injection Response",
                description="Response to SQL injection attempts",
                trigger_conditions={"threat_type": "SQL_INJECTION", "min_severity": "HIGH"},
                actions=[
                    PlaybookAction(
                        action_id="1",
                        action_type="update_waf_rules",
                        description="Update WAF with SQL injection patterns",
                        parameters={}
                    ),
                    PlaybookAction(
                        action_id="2",
                        action_type="block_ip",
                        description="Block attacker IP",
                        parameters={}
                    )
                ],
                auto_execute=False,  # Requires manual approval
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        }

    async def execute_playbook(self, playbook_id: str, threat: Threat) -> PlaybookExecution:
        """Execute a playbook for a given threat."""
        playbook = self.playbooks.get(playbook_id)

        if not playbook:
            raise ValueError(f"Playbook not found: {playbook_id}")

        execution = PlaybookExecution(
            execution_id=f"EXE-{uuid.uuid4().hex[:8].upper()}",
            playbook_id=playbook_id,
            threat_id=threat.id,
            status=PlaybookStatus.RUNNING,
            started_at=datetime.utcnow(),
            actions_executed=[],
            actions_failed=[]
        )

        logger.info(f"Executing playbook {playbook_id} for threat {threat.id}")

        try:
            for action in playbook.actions:
                try:
                    await self._execute_action(action, threat)
                    execution.actions_executed.append(action.action_id)
                    logger.debug(f"Action {action.action_id} executed: {action.description}")
                except Exception as e:
                    execution.actions_failed.append(action.action_id)
                    logger.error(f"Action {action.action_id} failed: {e}")

            execution.status = PlaybookStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            logger.info(f"Playbook {playbook_id} completed for threat {threat.id}")

        except Exception as e:
            execution.status = PlaybookStatus.FAILED
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            logger.error(f"Playbook {playbook_id} failed: {e}")

        self.executions.append(execution.dict())
        return execution

    async def _execute_action(self, action: PlaybookAction, threat: Threat):
        """Execute a single playbook action."""
        # Simulate action execution (in production, integrate with actual systems)
        logger.debug(f"Simulating action: {action.action_type} - {action.description}")

        # In production, this would make actual API calls to:
        # - Firewall APIs for IP blocking
        # - WAF APIs for rule updates
        # - IAM systems for credential rotation
        # - Ticket systems for alert creation
        # etc.

    def get_playbooks(self) -> List[Dict]:
        """Get all available playbooks."""
        return [pb.dict() for pb in self.playbooks.values()]

    def get_execution_history(self, limit: int = 50) -> List[Dict]:
        """Get recent playbook executions."""
        return self.executions[:limit]


# Global instance
_playbook_service = None


def get_playbook_service() -> PlaybookService:
    """Get the global PlaybookService instance."""
    global _playbook_service
    if _playbook_service is None:
        _playbook_service = PlaybookService()
    return _playbook_service
