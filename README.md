# VraiDaten — Edge-RAG Engineering Portfolio & Live Logbook

Live production site: **[https://vraidaten.com](https://vraidaten.com)** · Engineering Logbook: **[https://vraidaten.com/logbook/](https://vraidaten.com/logbook/)**

A zero-cost, security-hardened engineering portfolio built with **Astro 7**, **Tailwind CSS v4**, **Cloudflare Workers**, **Cloudflare Vectorize**, and **Workers AI**. It hosts a live, single-source-of-truth architectural logbook (mirroring standalone project repositories automatically) alongside an EU AI Act-transparent Edge-RAG assistant grounded strictly in repository documentation.

## Architecture & Data Flow

```mermaid
flowchart LR
    subgraph Local["Local Ingestion & DevSecOps Pipeline (Python 3.13 + uv)"]
        A["docs/ Markdown<br/>(Portfolio + Mirrored GCP Docs)"] --> B["rag_pipeline.ingest<br/>Section Chunking + Git SHA Lineage"]
        B --> C["rag_pipeline.embed<br/>bge-small-en-v1.5 (384-d)"]
    end

    subgraph Edge["Cloudflare Edge Runtime (Workers + Astro 7)"]
        C -->|"wrangler vectorize upsert"| D[("Vectorize Index<br/>vraidaten-index")]
        U["Browser / Client"] -->|"Static Pages"| S["Astro 7 Prerendered Assets<br/>/, /projects, /logbook, /contact"]
        U -->|"POST /api/chat"| G["Edge Guardrails<br/>Origin · 10 req/60s · 250-char · PII Filter"]
        G -->|"Query Embed + Top-6 (cos >= 0.60)"| D
        D --> M1["Primary SLM<br/>@cf/ibm-granite/granite-4.0-h-micro"]
        M1 -->|"Automatic Failover"| M2["Fallback LLM<br/>@cf/google/gemma-4-26b-a4b-it"]
        M1 --> U
        M2 --> U
    end
