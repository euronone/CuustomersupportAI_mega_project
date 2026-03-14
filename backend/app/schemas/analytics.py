from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_tickets: int = 0
    open_tickets: int = 0
    resolved_today: int = 0
    avg_resolution_time_hours: float = 0.0
    avg_first_response_minutes: float = 0.0
    csat_score: float = 0.0
    ai_resolution_rate: float = 0.0
    active_conversations: int = 0
