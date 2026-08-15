# PC-19 Operator Shell Product — Architecture Impact

**Package:** PC-19  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Ownership unchanged. No new SoT. No new domain.

---

## Frozen artifacts

| Artifact                        | Status after PC-19  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                    | Owner before                 | Owner after                            |
| -------------------------- | ---------------------------- | -------------------------------------- |
| Application chrome / nav   | Frontend shell (`AppLayout`) | Frontend shell (`AppLayout`)           |
| Identity / Auth            | Identity / Authentication    | Unchanged                              |
| Workspace                  | Workspace                    | Unchanged (PC-14 still owns switcher)  |
| Trading Session (Bot)      | Trading Session              | Unchanged                              |
| Exchange Scope (Cluster)   | Exchange Scope               | Unchanged                              |
| Command Center projections | Command Center               | Unchanged                              |
| Emergency Controls ports   | Unwired (PC-13)              | Still unwired; product hides the panel |

This package does not move ownership. It does not introduce an IDE shell. Residual `ide-shell` remains deferred.

---

## What was not changed

- JWT, Identity persistence, `/v1/auth`
- Workspace bootstrap
- Trading Session / paper session ports
- Command Center pause / resume / stop
- Research Control Center pages, Lab, campaigns
- Strategies CRUD, Knowledge search, `/ai/execute`
- Layout system, styling tokens, shared components (no redesign)
- Spec, Authority Matrix, Alias Dictionary, RC history

---

## Alias language

UI still says Bot for a Trading Session. Paper Bots is the paper path. Live is not a product label. Cluster is not advertised as a live engine. Strategies / Knowledge / AI keep their current names.

---

**End of Architecture Impact.**
