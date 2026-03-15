from __future__ import annotations
from typing import Optional
from datetime import date, datetime, timezone
from app.integrations.supabase_client import get_supabase


class TicketRepository:
    def __init__(self):
        self.table = "tickets"

    def get_by_id(self, ticket_id: str, tenant_id: str) -> Optional[dict]:
        result = (
            get_supabase()
            .table(self.table)
            .select("*")
            .eq("id", ticket_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def list(
        self,
        tenant_id: str,
        status: Optional[str] = None,
        assigned_agent_id: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[dict], int]:
        query = (
            get_supabase()
            .table(self.table)
            .select("*", count="exact")
            .eq("tenant_id", tenant_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        if status:
            query = query.eq("status", status)
        if assigned_agent_id:
            query = query.eq("assigned_agent_id", assigned_agent_id)

        result = query.execute()
        return result.data, result.count or 0

    def create(self, data: dict) -> dict:
        result = get_supabase().table(self.table).insert(data).execute()
        return result.data[0]

    def update(self, ticket_id: str, tenant_id: str, data: dict) -> dict:
        result = (
            get_supabase()
            .table(self.table)
            .update(data)
            .eq("id", ticket_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0]

    def count_by_status(self, tenant_id: str, status: str) -> int:
        result = (
            get_supabase()
            .table(self.table)
            .select("id", count="exact")
            .eq("tenant_id", tenant_id)
            .eq("status", status)
            .execute()
        )
        return result.count or 0

    def count_resolved_today(self, tenant_id: str) -> int:
        """Count tickets with status 'resolved' that were updated today (UTC)."""
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ).isoformat()
        result = (
            get_supabase()
            .table(self.table)
            .select("id", count="exact")
            .eq("tenant_id", tenant_id)
            .eq("status", "resolved")
            .gte("updated_at", today_start)
            .execute()
        )
        return result.count or 0

    def get_avg_resolution_time(self, tenant_id: str) -> float:
        """Calculate average resolution time in hours for resolved tickets.

        Returns the mean difference between updated_at and created_at
        for all tickets with status 'resolved'.  Returns 0.0 if there
        are no resolved tickets.
        """
        result = (
            get_supabase()
            .table(self.table)
            .select("created_at, updated_at")
            .eq("tenant_id", tenant_id)
            .eq("status", "resolved")
            .execute()
        )
        if not result.data:
            return 0.0

        total_hours = 0.0
        count = 0
        for ticket in result.data:
            created = datetime.fromisoformat(ticket["created_at"])
            updated = datetime.fromisoformat(ticket["updated_at"])
            delta = (updated - created).total_seconds() / 3600.0
            if delta >= 0:
                total_hours += delta
                count += 1

        return round(total_hours / count, 2) if count > 0 else 0.0


ticket_repo = TicketRepository()
