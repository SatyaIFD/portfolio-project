"""Cloudflare Workers AI embedding generator for Vectorize ingestion."""

from __future__ import annotations

import http.client
import json
import logging
import os
import sys
from pathlib import Path

DEFAULT_INPUT_FILE = "rag_pipeline/vectorize_payload.jsonl"
DEFAULT_VECTORS_FILE = "rag_pipeline/vectorize_vectors.ndjson"
DEFAULT_EMBEDDING_MODEL = "@cf/baai/bge-small-en-v1.5"
CF_API_HOST = "api.cloudflare.com"
HTTP_OK = 200
EXPECTED_DIMENSIONS = 384
REQUEST_TIMEOUT_SECONDS = 30

logging.basicConfig(
    level=logging.INFO,
    format=(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
        '"message": "%(message)s"}'
    ),
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)


def fetch_embeddings(
    texts: list[str],
    account_id: str,
    cf_credential: str,
    model: str = DEFAULT_EMBEDDING_MODEL,
) -> list[list[float]]:
    """Requests batch embeddings from Cloudflare Workers AI REST API."""
    endpoint = f"/client/v4/accounts/{account_id}/ai/run/{model}"
    payload = json.dumps({"text": texts})
    headers = {
        "Authorization": f"Bearer {cf_credential}",
        "Content-Type": "application/json",
    }

    conn = http.client.HTTPSConnection(CF_API_HOST, timeout=REQUEST_TIMEOUT_SECONDS)
    try:
        conn.request("POST", endpoint, body=payload, headers=headers)
        response = conn.getresponse()
        raw_body = response.read().decode("utf-8")
    finally:
        conn.close()

    if response.status != HTTP_OK:
        logger.error(f"Cloudflare AI API error ({response.status}): {raw_body}")
        raise RuntimeError(f"Workers AI request failed with status {response.status}")

    parsed = json.loads(raw_body)
    vectors: list[list[float]] = parsed.get("result", {}).get("data", [])
    if len(vectors) != len(texts):
        raise ValueError(
            f"Vector count mismatch: expected {len(texts)}, got {len(vectors)}"
        )

    for vec in vectors:
        if len(vec) != EXPECTED_DIMENSIONS:
            raise ValueError(
                f"Invalid vector dimension: {len(vec)} != {EXPECTED_DIMENSIONS}"
            )

    return vectors


def build_vectorize_ndjson(
    input_path: Path,
    output_path: Path,
    account_id: str,
    cf_credential: str,
    model: str = DEFAULT_EMBEDDING_MODEL,
) -> int:
    """Reads chunk JSONL, generates embeddings, and writes Vectorize NDJSON."""
    if not input_path.exists():
        logger.error(f"Input payload not found: {input_path}")
        raise FileNotFoundError(f"{input_path} does not exist.")

    lines = [
        line.strip()
        for line in input_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    records = [json.loads(line) for line in lines]
    texts = [str(record["text"]) for record in records]

    vectors = fetch_embeddings(
        texts=texts,
        account_id=account_id,
        cf_credential=cf_credential,
        model=model,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        for record, vector in zip(records, vectors, strict=True):
            vector_record = {
                "id": record["id"],
                "values": vector,
                "metadata": {
                    "source_file": record["metadata"]["source_file"],
                    "git_commit": record["metadata"]["git_commit"],
                    "text": record["text"],
                },
            }
            f.write(json.dumps(vector_record) + "\n")

    logger.info(f"Wrote {len(records)} embedded vectors to {output_path.name}")
    return len(records)


def main() -> None:
    """Main CLI entrypoint for generating Vectorize NDJSON payloads."""
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
    cf_credential = os.getenv("CF_AI_CREDENTIAL", "").strip()
    if not account_id or not cf_credential:
        logger.error(
            "Missing required environment variables: "
            "CLOUDFLARE_ACCOUNT_ID and CF_AI_CREDENTIAL"
        )
        sys.exit(1)

    input_path = Path(os.getenv("RAG_OUTPUT_FILE", DEFAULT_INPUT_FILE))
    output_path = Path(os.getenv("RAG_VECTORS_FILE", DEFAULT_VECTORS_FILE))
    model = os.getenv("CF_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)

    build_vectorize_ndjson(
        input_path=input_path,
        output_path=output_path,
        account_id=account_id,
        cf_credential=cf_credential,
        model=model,
    )


if __name__ == "__main__":
    main()
