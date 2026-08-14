# Exchange Scope (`exchange-scope`)

**RC-27** — Exchange Scope bounded context (Architecture Spec v2.0 §5.10).  
**RC-19** — Thin default Binance identity remains (`exchange-scope:binance`).

## Authority

| Concern                                      | Class                                       |
| -------------------------------------------- | ------------------------------------------- |
| Exchange Scope identity / config / lifecycle | **exchange_scope_artifact** (isolation SoT) |
| Exchange Risk Policy                         | **exchange_policy_input** (inputs only)     |
| Strategy Library / Gate / Session / Risk     | Never owned                                 |
| Orders / Execution / Accounting / Reporting  | Never owned                                 |

**UI alias:** Cluster (Alias Dictionary).

**Exchange Scope isolates. It never becomes Runtime, Session, Execution Engine, or Strategy Library.**

## Epic posture

| Epic                                    | Status                       |
| --------------------------------------- | ---------------------------- |
| 1 Boundary + ownership + inactive ports | Done                         |
| 2 Domain model                          | Done                         |
| 3 Application ports                     | **Active**                   |
| 4 Trading-path integration              | Done (identity propagation)  |
| 5 Consumer read ports                   | **Active** (approved)        |
| 6 Authority conformance                 | **Done** (CLOSED with RC-27) |

## Epic 5 consumer surfaces

Intended audiences (read only — never mutate Scope):

- Reporting · AI Analytics · Knowledge Lake · Command Center
- Notification Delivery · Trading Orchestrator · Multi-Exchange UI

Nest token: `EXCHANGE_SCOPE_CONSUMER_READ_PORT` → `ExchangeScopeConsumerReadService`

| Method                                        | Projection                                                  |
| --------------------------------------------- | ----------------------------------------------------------- |
| `listScopeProjections` / `getScopeProjection` | identity + active flag                                      |
| `getLifecycleProjection`                      | lifecycle only                                              |
| `getConfigSummaryProjection`                  | config summary                                              |
| `getPolicyInputProjection`                    | policy inputs (not Risk Decision)                           |
| `listAccountBindingProjections`               | bindings (no ledger authority)                              |
| `getMetadataProjection`                       | opaque metadata refs                                        |
| `getActiveStatusProjection`                   | active / capacity block flags                               |
| `getWorkspaceAggregateProjection`             | explicit cross-scope aggregate — **never invents balances** |

Query adapter: `ExchangeScopeConsumerReadAdapter` (store → frozen projections).

## Epic 4 surfaces

- Trading-path artifacts carry `exchangeScopeId` (default Binance)
- `assertSameExchangeScope` / `sameExchangeScope` alignment helpers
- Orders align Session/Account scope; Fill/Position/Ledger inherit
- RuntimeContext / SignalIntent carry scope; cross-scope reject
- Additive Prisma columns only — no engine clones / routing

## Epic 3 surfaces

- `ExchangeScopeServicePort` — register / activate / suspend / archive / config / policy / bind
- `ExchangeScopeQueryPort` — read scopes / config / policy / bindings / adapter context
- Process-local `InMemoryExchangeScopeStore` (not a persistence product)
- REST / transport remain inactive

## Dependency direction

```text
Consumers (Reporting / AI / Lake / CC / Notify / UI)
        │ read only
        ▼
ExchangeScopeConsumerReadPort
        │
        ▼
Exchange Scope (isolation / metadata SoT)

Forbidden: consumers → command Scope
Forbidden: Scope → Runtime / Orders / Execution / Session ownership
```

## Epic 6 conformance

- `conformance/authority-conformance.spec.ts` — ownership, deps, ports, reverse Nest surfaces
- `conformance/isolation-invariants.spec.ts` — Cluster Isolation Invariants 1–10 (≥2 scopes)
- Docs: Epic 6 report · Internal Audit (**PASS**) · Readiness (Validation separate)
