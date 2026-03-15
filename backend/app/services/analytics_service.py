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

    resolved_today = ticket_repo.count_resolved_today(tenant_id)
    avg_resolution_time_hours = ticket_repo.get_avg_resolution_time(tenant_id)

    return {
        "total_tickets": total,
        "open_tickets": open_count,
        "resolved_today": resolved_today,
        "avg_resolution_time_hours": avg_resolution_time_hours,
        "avg_first_response_minutes": 0.0,  # TODO: compute from timestamps
        "csat_score": 4.2,  # Placeholder until feedback collection is implemented
        "ai_resolution_rate": 0.35,  # Placeholder until AI vs human tracking is implemented
        "active_conversations": active_conversations,
    }
