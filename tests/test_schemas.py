"""Unit, schema contract, and negative security tests for rag_pipeline.schemas."""

from __future__ import annotations

import pytest

from rag_pipeline.schemas import KnowledgeChunk, validate_user_prompt


def test_valid_knowledge_chunk() -> None:
    chunk = KnowledgeChunk(
        chunk_id="cert-01",
        source_file="certification.md",
        content="Preparing for GCP Professional ML Engineer exam.",
        git_commit="6a80086",
    )
    chunk.validate()


def test_invalid_chunk_empty_id() -> None:
    chunk = KnowledgeChunk(
        chunk_id="   ",
        source_file="certification.md",
        content="Valid content.",
        git_commit="6a80086",
    )
    with pytest.raises(ValueError, match="chunk_id and source_file must be non-empty"):
        chunk.validate()


def test_invalid_chunk_empty_content() -> None:
    chunk = KnowledgeChunk(
        chunk_id="cert-01",
        source_file="certification.md",
        content="   ",
        git_commit="6a80086",
    )
    with pytest.raises(ValueError, match="Chunk content cannot be empty"):
        chunk.validate()


def test_invalid_chunk_bad_commit_sha() -> None:
    chunk = KnowledgeChunk(
        chunk_id="cert-01",
        source_file="certification.md",
        content="Valid content",
        git_commit="invalid_sha!",
    )
    with pytest.raises(ValueError, match="git_commit must be a valid"):
        chunk.validate()


def test_validate_user_prompt_valid() -> None:
    result = validate_user_prompt("  What is Satyajit's GCP architecture?  ")
    assert result == "What is Satyajit's GCP architecture?"


def test_validate_user_prompt_empty_negative() -> None:
    with pytest.raises(ValueError, match="Prompt cannot be empty"):
        validate_user_prompt("   ")


def test_validate_user_prompt_oversized_negative() -> None:
    with pytest.raises(ValueError, match="exceeds maximum length"):
        validate_user_prompt("a" * 501)


def test_validate_user_prompt_pii_blocked_security() -> None:
    with pytest.raises(PermissionError, match="Sensitive PII detected"):
        validate_user_prompt("Contact me at recruiter@company.com")
