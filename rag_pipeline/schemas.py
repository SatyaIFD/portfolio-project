"""Input/Output schema validation and lineage contracts for the RAG pipeline."""

from __future__ import annotations

import re
from dataclasses import dataclass

MAX_PROMPT_LENGTH: int = 500
MIN_SIMILARITY_SCORE: float = 0.70
PII_PATTERN: re.Pattern[str] = re.compile(
    r"\b(\d{3}-\d{2}-\d{4}|\d{13,16}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b"
)


@dataclass(frozen=True)
class KnowledgeChunk:
    """Validated Markdown chunk with Git lineage metadata."""

    chunk_id: str
    source_file: str
    content: str
    git_commit: str

    def validate(self) -> None:
        """Enforces data completeness, non-empty content, and commit hash format."""
        if not self.chunk_id.strip() or not self.source_file.strip():
            raise ValueError("chunk_id and source_file must be non-empty strings.")
        if not self.content.strip():
            raise ValueError("Chunk content cannot be empty.")
        if not re.fullmatch(r"[0-9a-f]{7,40}", self.git_commit):
            raise ValueError("git_commit must be a valid 7-40 char hex SHA.")


def validate_user_prompt(prompt: str) -> str:
    """Validates user query length, emptiness, and strips/blocks PII."""
    cleaned = prompt.strip()
    if not cleaned:
        raise ValueError("Prompt cannot be empty.")
    if len(cleaned) > MAX_PROMPT_LENGTH:
        raise ValueError(f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH} chars.")
    if PII_PATTERN.search(cleaned):
        raise PermissionError("Request blocked: Sensitive PII detected.")
    return cleaned
