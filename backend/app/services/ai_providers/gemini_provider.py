import os
from typing import Optional

from app.core.config import settings

try:
    from google import genai
except ImportError as exc:  # pragma: no cover - exercised when dependency is missing
    genai = None
    _GENAI_IMPORT_ERROR = exc
else:
    _GENAI_IMPORT_ERROR = None


def _get_client():
    env_api_key = os.getenv("GEMINI_API_KEY")
    if env_api_key is None:
        api_key = (settings.GEMINI_API_KEY or "").strip()
    else:
        api_key = env_api_key.strip()

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    if genai is None:
        raise RuntimeError(
            "The google-genai package is not installed. Install it with 'pip install google-genai'"
        ) from _GENAI_IMPORT_ERROR

    return genai.Client(api_key=api_key)


def generate_with_gemini(prompt: str):
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
    )

    return getattr(response, "text", "")