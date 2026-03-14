from fastapi import APIRouter, Depends

from app.schemas.admin import (
    AgentResponse,
    UpdateAgentRequest,
    AIConfigResponse,
    UpdateAIConfigRequest,
)
from app.schemas.common import ApiResponse
from app.core.security import require_role
from app.core.config import settings
from app.repositories.agent_repo import agent_repo

router = APIRouter()

admin_only = require_role("admin")


@router.get("/agents", response_model=dict)
async def list_agents(current_user: dict = Depends(admin_only)):
    agents = agent_repo.list_all(current_user["tenant_id"])
    return {"data": agents, "total": len(agents)}


@router.patch("/agents/{agent_id}", response_model=ApiResponse[AgentResponse])
async def update_agent(
    agent_id: str,
    body: UpdateAgentRequest,
    current_user: dict = Depends(admin_only),
):
    update_data = body.model_dump(exclude_none=True)
    if "status" in update_data and hasattr(update_data["status"], "value"):
        update_data["status"] = update_data["status"].value

    agent = agent_repo.update(agent_id, current_user["tenant_id"], update_data)
    return ApiResponse(data=agent)


@router.get("/config/ai", response_model=AIConfigResponse)
async def get_ai_config(current_user: dict = Depends(admin_only)):
    return AIConfigResponse(
        model=settings.EURI_MODEL,
        temperature=settings.EURI_TEMPERATURE,
        max_tokens=settings.EURI_MAX_TOKENS,
        embedding_model=settings.EURI_EMBEDDING_MODEL,
        rag_top_k=settings.RAG_TOP_K,
    )


@router.patch("/config/ai", response_model=AIConfigResponse)
async def update_ai_config(
    body: UpdateAIConfigRequest,
    current_user: dict = Depends(admin_only),
):
    # In MVP, update in-memory settings (persisted config requires DB table)
    if body.model is not None:
        settings.EURI_MODEL = body.model
    if body.temperature is not None:
        settings.EURI_TEMPERATURE = body.temperature
    if body.max_tokens is not None:
        settings.EURI_MAX_TOKENS = body.max_tokens

    return AIConfigResponse(
        model=settings.EURI_MODEL,
        temperature=settings.EURI_TEMPERATURE,
        max_tokens=settings.EURI_MAX_TOKENS,
        embedding_model=settings.EURI_EMBEDDING_MODEL,
        rag_top_k=settings.RAG_TOP_K,
    )
