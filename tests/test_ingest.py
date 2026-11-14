"""Unit tests for the Markdown ingestion pipeline."""

import json
from pathlib import Path

import pytest

from rag_pipeline.ingest import (
    chunk_markdown_file,
    get_current_git_commit,
    main,
    merge_heading_blocks,
)

EXPECTED_CHUNK_COUNT = 3


def test_get_current_git_commit_branch_ref(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.chdir(tmp_path)
    git_dir = tmp_path / ".git" / "refs" / "heads"
    git_dir.mkdir(parents=True)
    (tmp_path / ".git" / "HEAD").write_text("ref: refs/heads/main\n", encoding="utf-8")
    (git_dir / "main").write_text("1234567890\n", encoding="utf-8")

    assert get_current_git_commit() == "1234567"


def test_get_current_git_commit_detached_head(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.chdir(tmp_path)
    git_dir = tmp_path / ".git"
    git_dir.mkdir()
    (git_dir / "HEAD").write_text("1234567890\n", encoding="utf-8")

    assert get_current_git_commit() == "1234567"


def test_get_current_git_commit_missing_head(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.chdir(tmp_path)
    with pytest.raises(SystemExit):
        get_current_git_commit()


def test_get_current_git_commit_missing_ref(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.chdir(tmp_path)
    git_dir = tmp_path / ".git"
    git_dir.mkdir()
    (git_dir / "HEAD").write_text("ref: refs/heads/missing\n", encoding="utf-8")
    with pytest.raises(SystemExit):
        get_current_git_commit()


def test_merge_heading_blocks() -> None:
    blocks = ["# Title", "## Subtitle", "Paragraph 1", "Paragraph 2", "# Trailing"]
    merged = merge_heading_blocks(blocks)
    assert merged == [
        "# Title\n\n## Subtitle\n\nParagraph 1",
        "Paragraph 2",
        "# Trailing",
    ]


def test_chunk_markdown_file(tmp_path: Path) -> None:
    md_file = tmp_path / "test.md"
    md_file.write_text(
        "# Doc Title\n\nChunk 1\n\nChunk 2\n\n   \n\nChunk 3", encoding="utf-8"
    )
    chunks = chunk_markdown_file(md_file, "1234567")

    assert len(chunks) == EXPECTED_CHUNK_COUNT
    assert chunks[0].content == "# Doc Title\n\nChunk 1"
    assert chunks[0].chunk_id == "test-000"
    assert chunks[0].git_commit == "1234567"


def test_chunk_markdown_file_not_found(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        chunk_markdown_file(tmp_path / "missing.md", "1234567")


def test_main_dynamic_discovery_and_env(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr("rag_pipeline.ingest.get_current_git_commit", lambda: "1234567")

    custom_docs = tmp_path / "custom_docs"
    nested_decisions = custom_docs / "decisions"
    nested_decisions.mkdir(parents=True)
    (custom_docs / "architecture.md").write_text("Arch 1\n\nArch 2", encoding="utf-8")
    (nested_decisions / "001-adr.md").write_text(
        "# ADR Title\n\nADR 1", encoding="utf-8"
    )

    custom_output = tmp_path / "out" / "custom_payload.jsonl"
    monkeypatch.setenv("RAG_DOCS_DIR", str(custom_docs))
    monkeypatch.setenv("RAG_OUTPUT_FILE", str(custom_output))

    main()

    assert custom_output.exists()
    lines = custom_output.read_text(encoding="utf-8").splitlines()
    assert len(lines) == EXPECTED_CHUNK_COUNT

    first_record = json.loads(lines[0])
    assert first_record["id"] == "architecture-000"
    assert first_record["text"] == "Arch 1"
    assert first_record["metadata"]["git_commit"] == "1234567"

    last_record = json.loads(lines[-1])
    assert last_record["id"] == "001-adr-000"
    assert last_record["text"] == "# ADR Title\n\nADR 1"
