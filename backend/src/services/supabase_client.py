"""
Supabase client initialisation.

Uses the SERVICE ROLE key — this client runs server-side only and bypasses
Row Level Security. Never expose this key or this client to the frontend.

Every backend route/node that reads or writes skill_sessions, roadmaps,
test_history, user_stats, or feature_flags imports `supabase` from here.
"""

from functools import lru_cache

from supabase import create_client, Client

from src.config import get_settings

settings = get_settings()

@lru_cache
def get_supabase_client() -> Client:
    """
    Returns a cached Supabase client instance using the service role key.

    lru_cache ensures we only construct the client once per process —
    safe to call this from anywhere (routes, nodes, services).
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env "
            "before the Supabase client can be created."
        )

    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# Module-level convenience instance.
# NOTE: this will raise at import time if env vars are missing — that's
# intentional, it fails fast on Day 1 rather than failing silently later.
supabase: Client = get_supabase_client()
