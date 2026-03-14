from fastapi import APIRouter, Depends

from app.schemas.analytics import DashboardMetrics
from app.core.security import require_role
from app.services import analytics_service

router = APIRouter()


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard(current_user: dict = Depends(require_role("admin"))):
    return analytics_service.get_dashboard_metrics(current_user["tenant_id"])
