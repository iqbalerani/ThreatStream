"""
Playbooks API Routes
"""
from fastapi import APIRouter, HTTPException
from app.models.playbook import PlaybookExecuteRequest
from app.services.playbook_service import get_playbook_service
from app.services.firestore_service import get_firestore_service
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("")
async def get_playbooks():
    """
    Get all available playbooks.

    Returns:
        List of playbook definitions
    """
    playbook_service = get_playbook_service()
    playbooks = playbook_service.get_playbooks()

    return {"playbooks": playbooks, "count": len(playbooks)}


@router.post("/execute")
async def execute_playbook(request: PlaybookExecuteRequest):
    """
    Execute a playbook for a threat.

    Args:
        request: Playbook execution request with playbook_id and threat_id

    Returns:
        Playbook execution result
    """
    playbook_service = get_playbook_service()
    db = get_firestore_service()

    # Get the threat
    threat_dict = await db.get_threat(request.threat_id)
    if not threat_dict:
        raise HTTPException(status_code=404, detail="Threat not found")

    # Convert dict to Threat model (simplified)
    from app.models.threat import Threat
    threat = Threat(**threat_dict)

    # Execute playbook
    try:
        execution = await playbook_service.execute_playbook(
            playbook_id=request.playbook_id,
            threat=threat
        )

        return execution.dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history")
async def get_execution_history(limit: int = 50):
    """
    Get playbook execution history.

    Args:
        limit: Maximum number of executions to return

    Returns:
        List of recent playbook executions
    """
    playbook_service = get_playbook_service()
    history = playbook_service.get_execution_history(limit=limit)

    return {"executions": history, "count": len(history)}
