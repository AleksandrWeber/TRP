# Version 3 Readiness Dashboard

**Document:** Version 3 Readiness Dashboard
**Date:** 2026-08-16
**Status:** Annex — planning **FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md)
**Source:** [Capability Inventory](./v3-capability-inventory.md)

Readiness is reuse of **Version 2**, not progress of Version 3 implementation (which has not started).

| Scale | Meaning                          |
| ----- | -------------------------------- |
| 100%  | Already implemented in Version 2 |
| 75%   | Mostly reusable                  |
| 50%   | Partially reusable               |
| 25%   | Major implementation required    |
| 0%    | Does not exist                   |

Starting scores from certified Version 2: paper-first product **99%**, production **40%**, architecture **100%**.

---

## Summary

| Readiness        | In-scope count                  |
| ---------------- | ------------------------------- |
| 100%             | **7**                           |
| 75%              | **4**                           |
| 50%              | **16**                          |
| 25%              | **33**                          |
| 0%               | **22**                          |
| Deferred / out   | **4**                           |
| **Catalog rows** | **86** (including deferred/out) |
| **In-scope**     | **82**                          |
| Mean in-scope    | **32%**                         |

Product-level dashboard (canonical for Product Owners): [Master Plan §5](./version-3-master-plan.md).

---

## Dashboard

| Capability                          | Readiness | Priority | Wave         | Business impact                        | Dependencies           |
| ----------------------------------- | --------- | -------- | ------------ | -------------------------------------- | ---------------------- |
| SEC-01 Authentication               | 50%       | Critical | 1            | Stops weak identity in front of assets | PC-18, TD-005          |
| SEC-02 Authorization                | 50%       | Critical | 1            | Least privilege on commands            | RolesGuard, TD-006     |
| SEC-03 RBAC product                 | 50%       | Critical | 1            | Team separation of research vs capital | Role enum              |
| SEC-04 ABAC engine                  | 0%        | Low      | **Deferred** | Not justified; use existing gates      | SEC-03, Gate           |
| SEC-05 Session management           | 25%       | Critical | 1            | Revoke stolen sessions                 | JWT                    |
| SEC-06 Secret Vault                 | 0%        | Critical | 1            | Enables all customer connections       | New module             |
| SEC-07 Credential encryption        | 0%        | Critical | 1            | DB theft resistance                    | Vault                  |
| SEC-08 OWASP / API security         | 50%       | Critical | 1 / 6        | Tamper, XSS, SSRF, replay              | helmet, ValidationPipe |
| SEC-09 Audit trail                  | 25%       | Critical | 1            | Forensics                              | Identity               |
| SEC-10 Financial action logging     | 25%       | Critical | 6            | Fraud evidence                         | Orders, live path      |
| SEC-11 Workspace isolation          | 75%       | Critical | 1 / 9        | Tenant safety                          | PC-14                  |
| SEC-12 Credential rotation          | 0%        | High     | 2            | Stolen-key window                      | Vault, CM              |
| SEC-13 Security monitoring          | 0%        | High     | 3            | Detect abuse                           | Audit                  |
| SEC-14 Incident logging             | 50%       | High     | 1            | Reconstruct failures                   | US293                  |
| SEC-15 Security health dashboard    | 0%        | High     | 3            | Operable security                      | Vault, MN              |
| SEC-16 Tamper-evident financial ops | 25%       | Critical | 6            | Order-manipulation resistance          | Ledger pattern         |
| CM-01 Unified Connection Management | 25%       | Critical | 2            | Self-serve integrations                | Vault, owners          |
| CM-02 Connection Wizard             | 25%       | Critical | 2            | No SSH / `.env`                        | Telegram UX pattern    |
| CM-03 Connection testing            | 25%       | Critical | 2 / 4        | Fail before live                       | Adapters               |
| CM-04 Connection health             | 25%       | High     | 2            | Honest status                          | CM-01                  |
| CM-05 Workspace-scoped credentials  | 25%       | Critical | 2            | Per-tenant keys                        | Vault, isolation       |
| CM-06 No customer `.env`            | 0%        | Critical | 2            | Hosted operation                       | Vault, reload          |
| CM-07 Binance connectivity          | 50%       | Critical | 4            | First real venue                       | Public + stub adapter  |
| CM-08 Bybit connectivity            | 25%       | High     | 4            | Second venue, no engine clone          | Stub adapter           |
| CM-09 OKX connectivity              | 25%       | High     | 4            | Third venue                            | Stub adapter           |
| CM-10 Kraken connectivity           | 0%        | Medium   | 4            | Plugin-style new venue                 | Scope label            |
| CM-11 Telegram production           | 50%       | High     | 5            | Real operator alerts                   | PC-07, TD-049          |
| CM-12 Email SMTP                    | 25%       | High     | 5            | Universal channel                      | Reserved catalog       |
| CM-13 Slack                         | 25%       | Medium   | 5            | Team chat                              | Reserved catalog       |
| CM-14 Discord                       | 25%       | Medium   | 5            | Team chat                              | Reserved catalog       |
| CM-15 Microsoft Teams               | 25%       | Medium   | 5            | Enterprise chat                        | Reserved catalog       |
| CM-16 Push                          | 25%       | Medium   | 5            | Mobile attention                       | Reserved catalog       |
| CM-17 OpenRouter customer keys      | 50%       | High     | 2 / 7        | AI without shared key                  | AI Gateway             |
| CM-18 OpenAI provider               | 0%        | Medium   | 7            | Direct AI choice                       | Gateway plugin         |
| CM-19 Gemini provider               | 0%        | Medium   | 7            | Direct AI choice                       | Gateway plugin         |
| CM-20 Anthropic provider            | 0%        | Medium   | 7            | Direct AI choice                       | Gateway plugin         |
| CM-21 Future provider framework     | 50%       | Medium   | 2            | Markets not the ceiling                | Factories, catalogs    |
| LT-01 Live capital path             | 25%       | Critical | 6            | Earned production trading              | ADR, Waves 1–4         |
| LT-02 Live order I/O                | 0%        | Critical | 6            | Real venue orders                      | Wave 4 adapters        |
| LT-03 Durable Kill Switch           | 25%       | Critical | 3            | Capital preservation                   | Hidden REST, TD-047    |
| LT-04 Live operator UI              | 0%        | High     | 6            | Honest live chrome                     | LT-01/02, UI Policy    |
| NT-01 Notification settings         | 100%      | —        | Reuse        | Already a product                      | PC-06                  |
| NT-02 Durable notification queue    | 0%        | High     | 3            | Alerts survive restart                 | TD-045                 |
| AI-03 AI Analytics                  | 100%      | —        | Reuse        | Narratives from reports                | PC-17                  |
| AI-04 AI never controls capital     | 100%      | Critical | Invariant    | Safety                                 | Vision / Gate          |
| KN-01 Knowledge Lake                | 100%      | —        | Reuse        | Analytical warehouse                   | PC-16                  |
| KN-02 Research durability           | 25%       | Medium   | 7            | Knowledge survives restart             | TD-001                 |
| KN-03 Vector search                 | 0%        | Low      | 7 opt.       | Only if search fails                   | TD-007                 |
| AN-01 Reporting                     | 100%      | —        | Reuse        | RC-24 product                          | PC-05                  |
| AN-02 Advanced metrics              | 25%       | Medium   | 8            | Risk-adjusted evidence                 | TD-029                 |
| AN-03 Report exporters              | 0%        | Medium   | 7            | Share evidence                         | TD-031                 |
| AN-04 Configurable scoring          | 25%       | Low      | 8            | Honest comparison                      | TD-030                 |
| SE-01 Tactical envelopes            | 75%       | High     | 8            | Evolution without invention            | Tactics Option B       |
| SE-02 Certified tactic selection    | 50%       | Medium   | 8            | Human selects certified set            | Orchestrator           |
| SE-03 Auto strategy rotation        | 0%        | Low      | **Out**      | Future selector                        | —                      |
| PF-01 Portfolio projection          | 75%       | High     | 8            | Accounting projection                  | Ledger                 |
| PF-02 Portfolio product             | 50%       | High     | 8            | Operator portfolio                     | PF-01                  |
| RK-01 Risk Engine                   | 100%      | Critical | Reuse        | Single risk authority                  | Spec                   |
| RK-02 Risk product                  | 50%       | High     | 8            | Visible denials                        | Risk Engine            |
| RK-03 Live risk policies            | 50%       | Critical | 6            | Live limits                            | Exchange Scope         |
| WS-01 Workspace product             | 100%      | —        | Reuse        | Switch/create                          | PC-14                  |
| WS-02 Team membership               | 25%       | High     | 9            | Small teams                            | Workspace access       |
| WS-03 Multi-tenant isolation        | 25%       | High     | 1 / 9        | No cross-workspace keys                | Vault, adapters        |
| BL-01 Billing                       | 0%        | Medium   | 9            | Hosted SaaS                            | Isolated domain        |
| BL-02 Usage metering                | 0%        | Medium   | 9            | Billable usage                         | BL-01                  |
| AD-01 Administration console        | 25%       | High     | 9            | Operate the platform                   | Admin role             |
| AD-02 User administration           | 0%        | High     | 9            | Disable/revoke users                   | AD-01                  |
| DV-01 Customer API keys             | 0%        | Medium   | 9            | Programmatic access                    | Vault                  |
| DV-02 Webhooks                      | 0%        | Medium   | 9            | Outbound events                        | SSRF controls          |
| DV-03 Stable public API             | 50%       | Medium   | 9            | Versioned REST policy                  | Existing `/v1`         |
| MN-01 Health endpoints              | 75%       | Medium   | Reuse        | Process health                         | `/health`              |
| MN-02 Observability product         | 25%       | High     | 3            | See production                         | Metrics remnants       |
| MN-03 Operational alerting          | 25%       | High     | 3            | Page the operator                      | Notifications          |
| CP-01 Compliance reporting          | 0%        | Medium   | 10           | Evidence packs                         | Audit                  |
| CP-02 Retention & export            | 25%       | Medium   | 10           | Data lifecycle                         | Campaign export        |
| IN-01 Durable analytical stores     | 25%       | High     | 3            | Restart-safe V2 artifacts              | TD-048                 |
| IN-02 US295 / ADL-008               | 50%       | High     | 3            | Restart-safety claims                  | TD-036                 |
| IN-03 Job scheduler                 | 25%       | Medium   | 3 / 10       | Health probes                          | TD-004                 |
| IN-04 Durable queue default         | 50%       | Medium   | 3 / 10       | Jobs survive restart                   | BullMQ optional        |
| PE-02 Large dataset scale           | 25%       | Medium   | 10           | Lab at size                            | TD-033                 |
| PE-03 Ledger pagination             | 25%       | Medium   | 10           | Ops history                            | TD-041                 |
| PE-04 Playwright E2E                | 0%        | Medium   | 10           | Customer-path regression               | TD-043                 |
| OT-01 IDE shell                     | 25%       | Low      | 9 stretch    | UX Vision IDE feel                     | TD-046                 |
| OT-02 Market State classification   | 25%       | Low      | Stretch      | Regime labels                          | Market State owner     |
| Plugin marketplace                  | 0%        | —        | **Out**      | Future                                 | docs/future            |
| AI Scientist                        | 0%        | —        | **Out**      | Conflicts with math-first              | docs/future            |

---

## Readiness by group (in-scope only)

Average of **in-scope** capability rows is **32%**. That is expected: Version 3 extends the platform; it is not leftover polish.

| Group                                                        | Typical readiness | Interpretation                  |
| ------------------------------------------------------------ | ----------------- | ------------------------------- |
| Certified V2 products (Library, Certify, Lake, Reporting, …) | 100%              | Reuse; do not rebuild           |
| Security Platform                                            | ~25–50%           | Scaffolding; major product work |
| Connection Management                                        | ~25%              | Fragments only                  |
| Exchange connectivity                                        | ~25–50%           | Stubs + public data             |
| Live Trading                                                 | ~10–25%           | Path exists; I/O and UI do not  |
| Notification transports                                      | ~25–50%           | Catalog + fake Telegram         |
| AI providers                                                 | ~0–50%            | OpenRouter only                 |
| SaaS / billing / developer                                   | ~0–25%            | Workspace CRUD only             |
| Infrastructure residuals                                     | ~25–50%           | Known debt                      |

---

## How to use this dashboard after approval

1. Do not change Version 2 percentages to fake Version 3 progress.
2. When a package closes, update **that row’s readiness toward 100% of Version 3 declared scope** in a Version 3 status file — do not edit Audit v2 scores.
3. Wave exit requires every Critical row in that wave to be implemented or explicitly waived.

---

**STOP.** Baseline only. No implementation.
