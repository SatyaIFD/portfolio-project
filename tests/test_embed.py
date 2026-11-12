"""Unit tests for the Cloudflare Workers AI embedding pipeline."""

from __future__ import annotations

import http.client
import json
from pathlib import Path
from typing import Any

import pytest

from rag_pipeline.embed import (
    EXPECTED_DIMENSIONS,
    HTTP_OK,
    build_vectorize_ndjson,
    fetch_embeddings,
    main,
)

HTTP_BAD_REQUEST = 400
EXPECTED_RECORDS = 2


class DummyResponse:
    """Mock HTTP response for HTTPSConnection testing."""

    def __init__(self, status: int, body: dict[str, Any]) -> None:
        self.status = status
        self._raw = json.dumps(body).encode("utf-8")

    def read(self) -> bytes:
        return self._raw


class DummyConnection:
    """Mock HTTPSConnection for isolated unit testing."""

    def __init__(self, response: DummyResponse) -> None:
        self._response = response
        self.closed = False

    def request(
        self,
        method: str,
        url: str,
        body: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.method = method
        self.url = url
        self.body = body
        self.headers = headers

    def getresponse(self) -> DummyResponse:
        return self._response

    def close(self) -> None:
        self.closed = True


def test_fetch_embeddings_success(monkeypatch: pytest.MonkeyPatch) -> None:
    vec = [0.1] * EXPECTED_DIMENSIONS
    dummy_resp = DummyResponse(HTTP_OK, {"result": {"data": [vec]}})
    dummy_conn = DummyConnection(dummy_resp)
    monkeypatch.setattr(http.client, "HTTPSConnection", lambda *a, **kw: dummy_conn)

    result = fetch_embeddings(["hello"], "acc-123", "cred-123")
    assert len(result) == 1
    assert len(result[0]) == EXPECTED_DIMENSIONS
    assert dummy_conn.closed is True


def test_fetch_embeddings_http_error(monkeypatch: pytest.MonkeyPatch) -> None:
    dummy_resp = DummyResponse(HTTP_BAD_REQUEST, {"errors": ["bad request"]})
    monkeypatch.setattr(
        http.client,
        "HTTPSConnection",
        lambda *a, **kw: DummyConnection(dummy_resp),
    )

    with pytest.raises(RuntimeError, match="status 400"):
        fetch_embeddings(["hello"], "acc-123", "cred-123")


def test_fetch_embeddings_count_mismatch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    vec = [0.1] * EXPECTED_DIMENSIONS
    dummy_resp = DummyResponse(HTTP_OK, {"result": {"data": [vec]}})
    monkeypatch.setattr(
        http.client,
        "HTTPSConnection",
        lambda *a, **kw: DummyConnection(dummy_resp),
    )

    with pytest.raises(ValueError, match="Vector count mismatch"):
        fetch_embeddings(["one", "two"], "acc-123", "cred-123")


def test_fetch_embeddings_bad_dimension(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    dummy_resp = DummyResponse(HTTP_OK, {"result": {"data": [[0.1, 0.2]]}})
    monkeypatch.setattr(
        http.client,
        "HTTPSConnection",
        lambda *a, **kw: DummyConnection(dummy_resp),
    )

    with pytest.raises(ValueError, match="Invalid vector dimension"):
        fetch_embeddings(["hello"], "acc-123", "cred-123")


def test_build_vectorize_ndjson_missing_file(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        build_vectorize_ndjson(
            tmp_path / "missing.jsonl",
            tmp_path / "out.ndjson",
            "acc-123",
            "cred-123",
        )


def test_main_missing_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CLOUDFLARE_ACCOUNT_ID", raising=False)
    monkeypatch.delenv("CF_AI_CREDENTIAL", raising=False)
    with pytest.raises(SystemExit):
        main()


def test_main_end_to_end(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    input_file = tmp_path / "payload.jsonl"
    output_file = tmp_path / "vectors.ndjson"

    records = [
        {
            "id": "arch-000",
            "text": "Chunk 1",
            "metadata": {"source_file": "arch.md", "git_commit": "1234567"},
        },
        {
            "id": "arch-001",
            "text": "Chunk 2",
            "metadata": {"source_file": "arch.md", "git_commit": "1234567"},
        },
    ]
    input_file.write_text(
        "\n".join(json.dumps(r) for r in records) + "\n", encoding="utf-8"
    )

    vec = [0.25] * EXPECTED_DIMENSIONS
    monkeypatch.setattr(
        "rag_pipeline.embed.fetch_embeddings", lambda **kwargs: [vec, vec]
    )
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "acc-123")
    monkeypatch.setenv("CF_AI_CREDENTIAL", "cred-123")
    monkeypatch.setenv("RAG_OUTPUT_FILE", str(input_file))
    monkeypatch.setenv("RAG_VECTORS_FILE", str(output_file))

    main()

    assert output_file.exists()
    out_lines = output_file.read_text(encoding="utf-8").splitlines()
    assert len(out_lines) == EXPECTED_RECORDS

    first = json.loads(out_lines[0])
    assert first["id"] == "arch-000"
    assert len(first["values"]) == EXPECTED_DIMENSIONS
    assert first["metadata"]["text"] == "Chunk 1"
    assert first["metadata"]["git_commit"] == "1234567"
