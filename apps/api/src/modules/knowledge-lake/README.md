# Knowledge Lake (`knowledge-lake`)

**RC:** RC-21  
**Epic:** 6 — Authority conformance & acceptance  
**Authority class:** Projection / warehouse (never financial SoT)

## Ownership chain

```text
Source of Truth → Projection → Knowledge Lake
```

Knowledge Lake **never owns business state**. Producers remain SoT; Lake stores analytical copies only. Query results are **non-authoritative projections**.

## Ports

| Port                   | Token                           | Active            |
| ---------------------- | ------------------------------- | ----------------- |
| Ingestion              | `KNOWLEDGE_LAKE_INGESTION_PORT` | Yes (append-only) |
| Query                  | `KNOWLEDGE_LAKE_QUERY_PORT`     | Yes (read-only)   |
| Trading-path producers | outbox consumer                 | Yes (one-way)     |
| Research Lab producers | projection service              | Yes (one-way)     |
| Persistence product    | —                               | No                |

## Producers (RC-21)

| Producer id        | Categories       |
| ------------------ | ---------------- |
| `trading-session`  | Trading, System  |
| `orders`           | Trading          |
| `risk-engine`      | Risk             |
| `paper-trading`    | Paper            |
| `execution-engine` | Trading          |
| `research-lab`     | Research, System |

Reserved (not connected): `reporting`, `market-data`.

## Conformance (Epic 6)

Suite: `conformance/authority-conformance.spec.ts`  
Audit: `docs/project/rc-21-knowledge-lake-audit.md`  
Closure draft: `docs/project/rc-21-closure-report.md`

## This module is not

- Ledger / Positions / Fills SoT
- Orders / Trading Session / Risk / Execution command authority
- Research `knowledge` / Insight / Recommendation domains
- Reporting UI / AI / dashboards
- Durable persistence product
- Kafka / Redis / queues / event-sourcing redesign

See: `docs/project/rc-21-api-contract.md`, `docs/project/rc-21-epic6-authority-conformance.md`.
