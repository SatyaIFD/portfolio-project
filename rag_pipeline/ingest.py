"""Markdown ingestion and chunking module for the RAG pipeline."""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

from rag_pipeline.schemas import KnowledgeChunk

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
    head_file = Path(".git/HEAD")
    if not head_file.exists():
        logger.error("Git HEAD file not found.")
        sys.exit(1)

    head_content = head_file.read_text(encoding="utf-8").strip()
    if head_content.startswith("ref: "):
        ref_path = Path(".git") / head_content[5:]
        if not ref_path.exists():
            logger.error(f"Git ref file not found: {ref_path}")
            sys.exit(1)
        return ref_path.read_text(encoding="utf-8").strip()[:7]

    return head_content[:7]


def chunk_markdown_file(file_path: Path, commit_sha: str) -> list[KnowledgeChunk]:
    """Reads a Markdown file and splits it into validated KnowledgeChunks."""
    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        raise FileNotFoundError(f"{file_path} does not exist.")

    content = file_path.read_text(encoding="utf-8")

    # Heuristic: Split content by double newlines to isolate logical paragraphs
    raw_chunks = [c.strip() for c in content.split("\n\n") if c.strip()]

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
    docs_dir = Path("docs")
    output_file = Path("rag_pipeline/vectorize_payload.jsonl")

    commit_sha = get_current_git_commit()
    all_chunks: list[KnowledgeChunk] = []

    # Ground the AI on these specific architectural documents
    target_files = [
        "requirements.md",
        "architecture.md",
        "known-limitations.md",
    ]
    for filename in target_files:
        filepath = docs_dir / filename
        if filepath.exists():
            all_chunks.extend(chunk_markdown_file(filepath, commit_sha))

    # Export to JSONL format suitable for Cloudflare Workers AI batch embedding
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
