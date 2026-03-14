from app.repositories.ticket_repo import ticket_repo
from app.repositories.conversation_repo import conversation_repo


def get_dashboard_metrics(tenant_id: str) -> dict:
    """Aggregate dashboard metrics for a tenant."""
    open_count = ticket_repo.count_by_status(tenant_id, "open")
    pending_count = ticket_repo.count_by_status(tenant_id, "pending")
    resolved_count = ticket_repo.count_by_status(tenant_id, "resolved")
    closed_count = ticket_repo.count_by_status(tenant_id, "closed")
    active_conversations = conversation_repo.count_active(tenant_id)

    total = open_count + pending_count + resolved_count + closed_count

    return {
        "total_tickets": total,
        "open_tickets": open_count,
        "resolved_today": 0,  # TODO: filter by date
        "avg_resolution_time_hours": 0.0,  # TODO: compute from timestamps
        "avg_first_response_minutes": 0.0,  # TODO: compute from timestamps
        "csat_score": 0.0,  # TODO: implement feedback collection
        "ai_resolution_rate": 0.0,  # TODO: track AI vs human resolution
        "active_conversations": active_conversations,
    }
