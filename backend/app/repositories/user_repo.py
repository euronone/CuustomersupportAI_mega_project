from __future__ import annotations
from typing import Optional
from app.integrations.supabase_client import get_supabase


class UserRepository:
    def __init__(self):
        self.table = "users"

    def get_by_id(self, user_id: str) -> Optional[dict]:
        result = get_supabase().table(self.table).select("*").eq("id", user_id).execute()
        return result.data[0] if result.data else None

    def get_by_email(self, email: str) -> Optional[dict]:
        result = get_supabase().table(self.table).select("*").eq("email", email).execute()
        return result.data[0] if result.data else None

    def create(self, data: dict) -> dict:
        result = get_supabase().table(self.table).insert(data).execute()
        return result.data[0]

    def update(self, user_id: str, data: dict) -> dict:
        result = get_supabase().table(self.table).update(data).eq("id", user_id).execute()
        return result.data[0]


user_repo = UserRepository()
