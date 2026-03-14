import logging

logger = logging.getLogger("euron.redis")

_pool = None
_available = True


async def get_redis():
    """Get or create the async Redis client. Returns None if unavailable."""
    global _pool, _available
    if not _available:
        return None
    if _pool is None:
        try:
            import redis.asyncio as aioredis
            from app.core.config import settings
            _pool = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                max_connections=20,
            )
            # Test connection
            await _pool.ping()
            logger.info("Redis connected")
        except Exception as e:
            logger.warning(f"Redis unavailable, running without cache: {e}")
            _available = False
            _pool = None
            return None
    return _pool


async def close_redis():
    """Close the Redis connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# --- Cache helpers (gracefully degrade without Redis) ---

async def cache_get(key: str) -> str | None:
    r = await get_redis()
    if r is None:
        return None
    try:
        return await r.get(key)
    except Exception:
        return None


async def cache_set(key: str, value: str, ttl_seconds: int = 300):
    r = await get_redis()
    if r is None:
        return
    try:
        await r.set(key, value, ex=ttl_seconds)
    except Exception:
        pass


async def cache_delete(key: str):
    r = await get_redis()
    if r is None:
        return
    try:
        await r.delete(key)
    except Exception:
        pass
