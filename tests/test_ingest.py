"""Unit tests for the Markdown ingestion pipeline."""

import json
from pathlib import Path

import pytest

from rag_pipeline.ingest import (
    chunk_markdown_file,
    get_current_git_commit,
    main,
)


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


def test_chunk_markdown_file(tmp_path: Path) -> None:
    md_file = tmp_path / "test.md"
    md_file.write_text("Chunk 1\n\nChunk 2\n\n   \n\nChunk 3", encoding="utf-8")
    chunks = chunk_markdown_file(md_file, "1234567")

    assert len(chunks) == 3
    assert chunks[0].content == "Chunk 1"
    assert chunks[0].chunk_id == "test-000"
    assert chunks[0].git_commit == "1234567"


def test_chunk_markdown_file_not_found(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        chunk_markdown_file(tmp_path / "missing.md", "1234567")


def test_main(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr("rag_pipeline.ingest.get_current_git_commit", lambda: "1234567")

    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    (docs_dir / "requirements.md").write_text("Req 1\n\nReq 2", encoding="utf-8")
    (docs_dir / "architecture.md").write_text("Arch 1", encoding="utf-8")

    out_dir = tmp_path / "rag_pipeline"
    out_dir.mkdir()

    main()

    out_file = out_dir / "vectorize_payload.jsonl"
    assert out_file.exists()

    lines = out_file.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 3

    data = json.loads(lines[0])
    assert data["id"] == "requirements-000"
    assert data["text"] == "Req 1"
    assert data["metadata"]["git_commit"] == "1234567"
