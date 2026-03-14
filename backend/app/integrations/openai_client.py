import logging
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.exceptions import ExternalServiceException

logger = logging.getLogger("euron.euri")

_client: AsyncOpenAI | None = None


def get_euri_client() -> AsyncOpenAI:
    """Get or create the async EURI client (OpenAI-compatible)."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.EURI_API_KEY,
            base_url=settings.EURI_BASE_URL,
        )
    return _client


async def chat_completion(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> str:
    """Send a chat completion request via EURI API and return the assistant message content."""
    client = get_euri_client()
    try:
        response = await client.chat.completions.create(
            model=model or settings.EURI_MODEL,
            messages=messages,
            temperature=temperature if temperature is not None else settings.EURI_TEMPERATURE,
            max_tokens=max_tokens or settings.EURI_MAX_TOKENS,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error("EURI chat completion failed", extra={"error": str(e)})
        raise ExternalServiceException("EURI", str(e))


async def generate_embedding(text: str) -> list[float]:
    """Generate an embedding vector via EURI API."""
    client = get_euri_client()
    try:
        response = await client.embeddings.create(
            model=settings.EURI_EMBEDDING_MODEL,
            input=text,
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error("EURI embedding failed", extra={"error": str(e)})
        raise ExternalServiceException("EURI", str(e))


async def chat_completion_stream(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
):
    """Stream chat completion tokens via EURI API. Yields content deltas."""
    client = get_euri_client()
    try:
        stream = await client.chat.completions.create(
            model=model or settings.EURI_MODEL,
            messages=messages,
            temperature=temperature if temperature is not None else settings.EURI_TEMPERATURE,
            max_tokens=max_tokens or settings.EURI_MAX_TOKENS,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
    except Exception as e:
        logger.error("EURI streaming failed", extra={"error": str(e)})
        raise ExternalServiceException("EURI", str(e))
