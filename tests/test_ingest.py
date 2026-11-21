"""Unit tests for the Markdown ingestion pipeline."""

import json
from pathlib import Path

import pytest

from rag_pipeline.ingest import (
    build_chunk_id,
    chunk_markdown_file,
    get_current_git_commit,
    main,
    split_markdown_sections,
)

EXPECTED_CHUNK_COUNT = 3
EXPECTED_SECTION_COUNT = 3
EXPECTED_SINGLE_CHUNK_COUNT = 1
MAX_VECTORIZE_ID_BYTES = 64


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


def test_split_markdown_sections() -> None:
    markdown = "\n".join(
        [
            "# Doc Title",
            "## Section A",
            "Body A line.",
            "### Sub B",
            "- Bullet item",
            "## Empty Header",
            "## Section C",
            "Body C line.",
        ]
    )
    sections = split_markdown_sections(markdown)

    assert len(sections) == EXPECTED_SECTION_COUNT
    assert all("# Doc Title" in sec for sec in sections)
    assert "## Empty Header" not in "\n".join(sections)

    sub_b_section = next(sec for sec in sections if "### Sub B" in sec)
    assert "# Doc Title" in sub_b_section
    assert "## Section A" in sub_b_section
    assert "- Bullet item" in sub_b_section


def test_build_chunk_id_collision_and_length() -> None:
    id_portfolio = build_chunk_id("projects/vraidaten-portfolio/architecture.md", 0)
    id_gcp = build_chunk_id("projects/gcp-end-to-end/architecture.md", 0)

    assert id_portfolio != id_gcp
    assert id_portfolio.endswith("-000")
    assert id_gcp.endswith("-000")

    long_rel_path = f"projects/{'a' * 95}.md"
    long_id = build_chunk_id(long_rel_path, 0)
    assert len(long_id.encode("utf-8")) <= MAX_VECTORIZE_ID_BYTES


def test_chunk_markdown_file(tmp_path: Path) -> None:
    md_file = tmp_path / "test.md"
    md_file.write_text(
        "# Doc Title\n\n## S1\nBody 1\n\n## S2\nBody 2\n\n## S3\nBody 3\n",
        encoding="utf-8",
    )
    chunks = chunk_markdown_file(md_file, "1234567")

    assert len(chunks) == EXPECTED_CHUNK_COUNT
    assert "# Doc Title" in chunks[0].content
    assert "## S1" in chunks[0].content
    assert "Body 1" in chunks[0].content
    assert chunks[0].chunk_id == build_chunk_id("test.md", 0)
    assert chunks[0].source_file == "test.md"
    assert chunks[0].git_commit == "1234567"


def test_chunk_markdown_file_with_docs_dir(tmp_path: Path) -> None:
    rel_file = Path("projects") / "gcp-end-to-end" / "architecture.md"
    md_file = tmp_path / rel_file
    md_file.parent.mkdir(parents=True, exist_ok=True)
    md_file.write_text("# GCP Architecture\n\nOverview paragraph.", encoding="utf-8")

    chunks = chunk_markdown_file(md_file, "1234567", docs_dir=tmp_path)

    assert len(chunks) == EXPECTED_SINGLE_CHUNK_COUNT
    assert chunks[0].source_file == "projects/gcp-end-to-end/architecture.md"
    assert chunks[0].chunk_id == build_chunk_id(
        "projects/gcp-end-to-end/architecture.md", 0
    )


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
    (custom_docs / "architecture.md").write_text(
        "# Arch\n\n## Part 1\nArch 1\n\n## Part 2\nArch 2", encoding="utf-8"
    )
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
    assert first_record["id"] == build_chunk_id("architecture.md", 0)
    assert first_record["metadata"]["source_file"] == "architecture.md"
    assert "# Arch" in first_record["text"]
    assert "## Part 1" in first_record["text"]
    assert "Arch 1" in first_record["text"]
    assert first_record["metadata"]["git_commit"] == "1234567"

    last_record = json.loads(lines[-1])
    assert last_record["id"] == build_chunk_id("decisions/001-adr.md", 0)
    assert last_record["metadata"]["source_file"] == "decisions/001-adr.md"
    assert last_record["text"] == "# ADR Title\n\nADR 1"
