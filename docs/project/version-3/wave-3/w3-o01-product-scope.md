# W3-O01 Product Scope

**Package:** W3-O01 Durable Analytical Stores
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O01 · IN-01 · TD-048
**Status:** Implementation package — Planning **COMPLETE**. Not implementation. Awaiting Product Owner Planning Review and Approval.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w3-o01-implementation-package.md`](./w3-o01-implementation-package.md)
**Overview:** [`durability-overview.md`](./durability-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W3-O01. It does not redesign Version 2 analytical domains. It does not invent a second Lake or Outbox. It does not reopen Wave 1 or Wave 2. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 3 COMPLETE.

**Naming clarity:** `W3-O01` is the operational package ID for Master Plan / Execution Roadmap **V3-O01**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory for IN-01 / TD-048.

---

## Product purpose

Durable Analytical Stores is the product package that defines how **operator-relied Version 2 analytical artifacts survive API restart** (default), or are **honestly labeled ephemeral** when they do not.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** own Reporting / Notification / Orchestrator domain logic as a new product.

It does **not** own Notification durable queue (O02), US295 stance (O03), Kill Switch product (O04), Monitoring (O05), Live Trading, Wave 4 venue I/O, or Wave 5 transports.

```text
Existing analytical domain owners own domain logic and aggregates.
Durable Analytical Stores owns survive-restart / honest-ephemeral outcomes for IN-01.
Survive-restart does NOT mean Live Trading enabled.
Survive-restart does NOT mean Monitoring Complete.
Survive-restart does NOT mean production restart-safety Complete (O03+).
Survive-restart does NOT mean Wave 3 COMPLETE.
```

---

## Why Durable Analytical Stores exists (business language)

Wave 1 closed Security Foundation. Wave 2 closed Connection Management. Neither package owned restart-safe analytical stores for certified V2 process-local modules.

Paying operators lose Reporting / related analytical artifacts on restart, or cannot tell what survived. Master Plan Wave 3 and Execution Roadmap V3-O01 name this outcome. TD-048 remains the residual.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Rely on in-scope analytical artifacts remaining after API restart
- Or see honest ephemeral labeling when a surface does not survive
- Stay inside their workspace and their authorization
- Never receive Live Trading, Monitoring Complete, Kill Switch Complete, or Wave 3 COMPLETE from this package
- Never need SSH to recover silently dropped in-scope artifacts

---

## Consumes

| Product                               | How this package uses it                            | Must not do                               |
| ------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| **Authentication**                    | Only signed-in operators access analytical surfaces | Parallel login                            |
| **Authorization**                     | Only permitted roles may access                     | New IAM                                   |
| **Workspace Isolation**               | Analytical artifacts stay in one workspace          | Cross-workspace convenience               |
| **Vault**                             | No local secret store; secrets remain Vault         | Duplicate store; echo plaintext           |
| **Security Platform**                 | Hardening and abuse/rate-limit defaults             | Fork platform controls                    |
| **Security Audit**                    | Attributable durability-relevant outcomes           | Own the audit store                       |
| **Existing V2 analytical aggregates** | Persist / survive on existing owners                | Invent second Lake / Outbox / domain      |
| **Existing Outbox / Inbox**           | Consume if already used by analytical paths         | Second Outbox                             |
| **Wave 2 CLOSED products**            | Context available; not redesigned                   | Reopen Connections / Paper / AI ownership |

---

## Owns

| Outcome                                         | Customer meaning                                             |
| ----------------------------------------------- | ------------------------------------------------------------ |
| Durable analytical store outcomes               | Operator-relied in-scope artifacts survive API restart       |
| Honest ephemeral labeling                       | Non-surviving surfaces are labeled honestly (exception path) |
| Restart-survival honesty                        | No silent loss presented as success                          |
| Workspace-scoped analytical durability outcomes | A cannot use B’s artifacts                                   |
| Attributable durability outcomes                | Emit to Security Audit where required                        |

---

## Does NOT own

| Concern                                 | Real owner                              |
| --------------------------------------- | --------------------------------------- |
| Secret ciphertext / encryption          | Vault                                   |
| Identity / sessions                     | Authentication                          |
| Permissions                             | Authorization                           |
| Workspace membership / isolation SoT    | Workspace / Isolation                   |
| Security Platform defaults              | Security Platform                       |
| Audit persistence                       | Security Audit                          |
| Reporting domain product                | Existing Reporting owner                |
| Notification transports / durable queue | Wave 5 / V3-O02                         |
| Orchestrator domain rewrite             | Existing Orchestrator owner             |
| Knowledge Lake as new SoT               | Lake remains projection; no second Lake |
| Kill Switch product                     | V3-O04                                  |
| Monitoring & security health            | V3-O05                                  |
| US295 / ADL-008 stance                  | V3-O03                                  |
| Live Trading                            | Wave 6 / Order Path                     |
| Connection Management                   | Wave 2 (COMPLETE)                       |
| Canonical Order Path / Ledger           | Existing owners                         |

---

## IN Scope

| Item                       | Customer meaning                              |
| -------------------------- | --------------------------------------------- |
| Analytical store inventory | Process-local surfaces known and classified   |
| Durable analytical stores  | Survive restart for operator-relied artifacts |
| Honest ephemeral labels    | Exception path only; default survive          |
| Restart-survival proof     | Artifact present after API restart            |
| Workspace isolation        | A↛B                                           |
| Authorization              | Unauthorized deny                             |
| Operator walkthrough       | Durable Analytical Stores Walkthrough         |
| Security boundaries        | Consume Wave 1 + Wave 2; do not redefine      |
| Audit interaction          | Emit required durability outcomes             |
| Failure philosophy         | Fail closed; no fake success                  |
| Validation strategy        | Close criteria, evidence, regressions         |

---

## OUT OF Scope

Explicitly out of this package:

| Item                           | Declaration                          |
| ------------------------------ | ------------------------------------ |
| Notification durable queue     | **No O02**                           |
| US295 / ADL-008 Complete       | **No O03**                           |
| Durable Kill Switch product    | **No O04**                           |
| Monitoring & security health   | **No O05**                           |
| Second Knowledge Lake          | **Forbidden**                        |
| Second Outbox                  | **Forbidden**                        |
| Live Trading                   | **No Live Trading**                  |
| Wave 4 venue I/O               | Out                                  |
| Wave 5 production transports   | Out                                  |
| Wave 1 / Wave 2 redesign       | Out                                  |
| Master Plan changes            | Out                                  |
| Version 2 architecture changes | Out                                  |
| Ownership changes              | Out                                  |
| Implementation slices          | **Not opened in this planning task** |
| Wave 3 COMPLETE declaration    | Out                                  |

---

## Ownership (binding)

### Architecture consume diagram (planning)

```text
Durable Analytical Stores (W3-O01 / V3-O01)
        │ consumes
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Vault
        ├── Security Platform
        ├── Security Audit
        ├── Existing V2 analytical aggregates / ports
        ├── Existing Outbox / Inbox (no second Outbox)
        └── Closed Wave 2 products (context only)

Durable Analytical Stores
        │ owns (product outcomes)
        ├── durable analytical store outcomes (IN-01)
        ├── honest ephemeral labeling (exception path)
        ├── restart-survival honesty
        └── attributable durability outcomes (emit only)
```

---

## Honesty model

| Claim                                | Meaning                                                  | Not meaning                                        |
| ------------------------------------ | -------------------------------------------------------- | -------------------------------------------------- |
| **Survives restart**                 | Named artifact still available after API process restart | Live Trading; Monitoring Complete; Wave 3 COMPLETE |
| **Ephemeral (honest)**               | Product states this surface does not survive restart     | Silent wipe; fake durable                          |
| **Durable Analytical Stores Closed** | O01 acceptance evidenced                                 | O02…O05 Closed; production restart-safety Complete |

---

## Failure philosophy

- Fail closed on missing auth / workspace / permission.
- Never present missing post-restart artifacts as still present.
- Never invent success for degraded dependencies.
- Prefer survive; ephemeral only with explicit honesty.
- Secrets never echo.

---

## Product Acceptance Criteria

| #   | Outcome                                                                               | Fail if               |
| --- | ------------------------------------------------------------------------------------- | --------------------- |
| 1   | In-scope operator-relied analytical artifacts survive API restart                     | Silent loss           |
| 2   | Non-surviving in-scope surfaces honestly labeled ephemeral                            | Silent ephemeral wipe |
| 3   | No fake “still present” when gone                                                     | Dishonest success     |
| 4   | Cross-workspace deny                                                                  | Leak                  |
| 5   | Unauthorized deny                                                                     | Privilege bypass      |
| 6   | No Live Trading / Monitoring Complete / Kill Switch Complete / Wave 3 COMPLETE claims | Dishonest claim       |
| 7   | No plaintext secret exposure                                                          | Exposure              |
| 8   | No second Lake / Outbox                                                               | Architecture drift    |

---

## Required implementation slices (planning only — not started)

| Slice    | Name                                                  |
| -------- | ----------------------------------------------------- |
| W3-O01-a | Analytical store inventory & honesty baseline         |
| W3-O01-b | Durable persistence for priority analytical artifacts |
| W3-O01-c | Restart-survival proof & degraded honesty             |
| W3-O01-d | Security verification + package Close evidence        |

Do not open these slices until Product Owner Approves planning and sequences implementation.

---

## Mandatory Questions

1. **What business problem does Wave 3 solve?**
   Production durability and continuity: restarts must not silently destroy operator-relied artifacts; kill switch, monitoring/health, and recovery stance must exist before later live claims.

2. **Why can Wave 2 not solve this problem?**
   Wave 2 owned Connection Management and deferred durability / ops / continuity products to Wave 3.

3. **Which existing products are consumed?**
   Authn, Authz, Isolation, Vault, Security Platform, Security Audit; Closed Wave 2; existing V2 analytical aggregates / Outbox / Inbox / Lake projection.

4. **What does Wave 3 own?**
   V3-O01…O05 durability, operations, and continuity outcomes. W3-O01 owns IN-01 durable analytical store outcomes.

5. **What is explicitly out of scope?**
   Live Trading; O02–O05 from this package; second Lake/Outbox; Master Plan / Version 2 / Wave 1 / Wave 2 modifications; ownership changes; implementation before Approval; Wave 3 COMPLETE from planning.

6. **Does this planning modify Wave 1?**
   No.

7. **Does this planning modify Wave 2?**
   No.

8. **Does this planning modify Version 2 architecture?**
   No.

---

**STOP.** Wait for Product Owner Planning Review before W3-O01 implementation begins.
