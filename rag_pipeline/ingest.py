"""Markdown ingestion and chunking module for the RAG pipeline."""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

from rag_pipeline.schemas import KnowledgeChunk

DEFAULT_DOCS_DIR = "docs"
DEFAULT_OUTPUT_FILE = "rag_pipeline/vectorize_payload.jsonl"
GIT_DIR_PATH = ".git"
GIT_HEAD_PATH = ".git/HEAD"
GIT_REF_PREFIX = "ref: "
SHORT_SHA_LENGTH = 7

# Configure structured JSON logging
logging.basicConfig(
    level=logging.INFO,
    format=(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
        '"message": "%(message)s"}'
    ),
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)


def get_current_git_commit() -> str:
    """Retrieves the current short Git commit SHA directly from .git/HEAD."""
    head_file = Path(GIT_HEAD_PATH)
    if not head_file.exists():
        logger.error("Git HEAD file not found.")
        sys.exit(1)

    head_content = head_file.read_text(encoding="utf-8").strip()
    if head_content.startswith(GIT_REF_PREFIX):
        ref_rel_path = head_content.removeprefix(GIT_REF_PREFIX)
        ref_path = Path(GIT_DIR_PATH) / ref_rel_path
        if not ref_path.exists():
            logger.error(f"Git ref file not found: {ref_path}")
            sys.exit(1)
        return ref_path.read_text(encoding="utf-8").strip()[:SHORT_SHA_LENGTH]

    return head_content[:SHORT_SHA_LENGTH]


def merge_heading_blocks(raw_blocks: list[str]) -> list[str]:
    """Merges standalone single-line Markdown headings into the following paragraph."""
    merged_chunks: list[str] = []
    pending_header = ""

    for block in raw_blocks:
        if block.startswith("#") and "\n" not in block:
            pending_header = f"{pending_header}\n\n{block}" if pending_header else block
        elif pending_header:
            merged_chunks.append(f"{pending_header}\n\n{block}")
            pending_header = ""
        else:
            merged_chunks.append(block)

    if pending_header:
        merged_chunks.append(pending_header)

    return merged_chunks


def chunk_markdown_file(file_path: Path, commit_sha: str) -> list[KnowledgeChunk]:
    """Reads a Markdown file and splits it into validated KnowledgeChunks."""
    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        raise FileNotFoundError(f"{file_path} does not exist.")

    content = file_path.read_text(encoding="utf-8")

    # Split content by double newlines and attach standalone headings to body blocks
    raw_blocks = [c.strip() for c in content.split("\n\n") if c.strip()]
    raw_chunks = merge_heading_blocks(raw_blocks)

    validated_chunks: list[KnowledgeChunk] = []
    for idx, text in enumerate(raw_chunks):
        chunk_id = f"{file_path.stem}-{idx:03d}"
        chunk = KnowledgeChunk(
            chunk_id=chunk_id,
            source_file=file_path.name,
            content=text,
            git_commit=commit_sha,
        )
        chunk.validate()
        validated_chunks.append(chunk)

    logger.info(
        f"Processed {file_path.name}: {len(validated_chunks)} chunks generated."
    )
    return validated_chunks


def main() -> None:
    """Main execution entrypoint for local ingestion."""
    docs_dir = Path(os.getenv("RAG_DOCS_DIR", DEFAULT_DOCS_DIR))
    output_file = Path(os.getenv("RAG_OUTPUT_FILE", DEFAULT_OUTPUT_FILE))

    commit_sha = get_current_git_commit()
    all_chunks: list[KnowledgeChunk] = []

    # Dynamically discover all Markdown files across docs/ and subdirectories
    for filepath in sorted(docs_dir.rglob("*.md")):
        all_chunks.extend(chunk_markdown_file(filepath, commit_sha))

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with output_file.open("w", encoding="utf-8") as f:
        for chunk in all_chunks:
            record = {
                "id": chunk.chunk_id,
                "text": chunk.content,
                "metadata": {
                    "source_file": chunk.source_file,
                    "git_commit": chunk.git_commit,
                },
            }
            f.write(json.dumps(record) + "\n")

    logger.info(f"Exported {len(all_chunks)} total chunks to {output_file.name}")


if __name__ == "__main__":
    main()
