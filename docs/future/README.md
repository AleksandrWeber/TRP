# Future (Out of Scope for V1)

**Status:** Deferred  
**Rule:** Nothing here is required for Stage 0 or Stage 1. Do not implement these until Stage 1 exit criteria are met and a real need appears.

Canonical stack, MVP, and stages: see [`../CANONICAL.md`](../CANONICAL.md).

---

## Deferred capabilities

| Topic                                 | Notes                                                        |
| ------------------------------------- | ------------------------------------------------------------ |
| SHIELD                                | External AI security gateway — separate product later        |
| AI Scientist / multi-agent org        | V1 AI is OpenRouter Gateway only                             |
| Market State Engine                   | Regime classification — not needed for one-strategy MVP      |
| Strategy Selector                     | Auto strategy rotation — after multiple certified strategies |
| Multi-exchange                        | Binance only in V1                                           |
| Portfolio management                  | Single symbol / simple exposure for now                      |
| Plugin marketplace                    | Markets as plugins remains a principle; marketplace is later |
| RAG / vector DB                       | Full-text search first; vectors only if search fails         |
| Kubernetes                            | Docker Compose for V1                                        |
| GraphQL                               | REST + WebSocket only                                        |
| Multi-user SaaS / teams               | Single user MVP                                              |
| Python research workers               | Revisit only if TS backtest/validation is insufficient       |
| Bayesian / GA / heavy ML optimization | After basic edge pipeline exists                             |

---

## Archived detailed designs

Moved here from active Architecture (reference only):

- [`007-AI-Research-Organization.md`](./007-AI-Research-Organization.md) — former multi-agent AI design
- [`014-Plugin-Architecture.md`](./014-Plugin-Architecture.md) — full plugin marketplace / multi-market plugin system

Older full drafts of top-level docs live in [`../archive/`](../archive/).

---

## When to promote something back

Promote a topic into active Architecture / Implementation only when:

1. Stage 0–1 MVP works end-to-end
2. There is a concrete user or operational need
3. `CANONICAL.md` is updated to reflect the change
