# W3-O02 Product Scope

**Package:** W3-O02 Notification Durable Queue
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O02 · NT-02 · TD-045
**Status:** Planning **COMPLETE**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w3-o02-implementation-package.md`](./w3-o02-implementation-package.md)
**Overview:** [`notification-durable-queue-overview.md`](./notification-durable-queue-overview.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W3-O02. It does not redesign Version 2 Notification domains. It does not invent a second Lake or Outbox. It does not reopen Wave 1, Wave 2, or W3-O01. It does not revise the Master Plan. It does not introduce Live Trading or Wave 5 production transports. It does not claim Wave 3 COMPLETE.

**Naming clarity:** `W3-O02` is the operational package ID for Master Plan / Execution Roadmap **V3-O02**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory for NT-02 / TD-045.

---

## Product purpose

Notification Durable Queue is the product package that defines how **in-flight notification delivery work survives API restart** (default), or how the product records **honest failure / unavailable** when delivery cannot complete — never a silent drop without a record.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** own Notification settings / routing product rewrite (NT-01).

It does **not** own Wave 5 production transports (Telegram Bot API, SMTP, Slack/Discord/Teams, Push).

It does **not** own paper Outbox/Inbox (TD-035 — resolved, distinct).

It does **not** own US295 stance (O03), Kill Switch product (O04), Monitoring (O05), Live Trading, or Wave 4 venue I/O.

```text
Existing notification-delivery owner owns delivery domain and aggregates.
Notification Durable Queue owns survive-restart / no-silent-drop outcomes for NT-02.
W3-O02 extends existing durability mechanisms only — no new persistence owner.
Queue durable does NOT mean Wave 5 production transports.
Queue durable does NOT mean Live Trading enabled.
Queue durable does NOT mean Monitoring Complete.
Queue durable does NOT mean production restart-safety Complete (O03+).
Queue durable does NOT mean Wave 3 COMPLETE.
```

---

## Durability Clarification (binding)

| Question                                           | Answer  |
| -------------------------------------------------- | ------- |
| Does W3-O02 extend existing durability mechanisms? | **YES** |
| Does W3-O02 introduce any new persistence owner?   | **NO**  |
| Does W3-O02 create a second Outbox?                | **NO**  |
| Is TD-045 the same as TD-035?                      | **NO**  |

Existing **notification-delivery** owner is **extended only**. Residual TD-045 vocabulary is not a new Source of Truth and is not the paper Outbox.

---

## Why Notification Durable Queue exists (business language)

Wave 1 closed Security Foundation. Wave 2 closed Connection Management. W3-O01 closed Durable Analytical Stores — including notification **history** and related analytical artifacts.

None of those packages owned a **durable delivery queue** for in-flight notification work. Master Plan Wave 3 and Execution Roadmap V3-O02 name this outcome. TD-045 remains the residual. Wave 5 Notification Platform depends on this Wave 3 queue.

---

## Why W3-O01 is insufficient

W3-O01 made operator-relied **analytical** artifacts survive restart (preferences, Telegram connect state, DeliveryResult **history**). It explicitly declared Notification durable queue **out → W3-O02**.

Surviving history is not the same as surviving **pending / in-flight / retryable delivery work**. Without O02, restart can still silently drop owed alerts.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Rely on in-scope in-flight notification delivery work remaining or resuming after API restart
- Or see honest failure / unavailable when delivery cannot complete — never silent wipe as success
- Stay inside their workspace and their authorization
- Never receive Live Trading, Wave 5 Complete, Monitoring Complete, Kill Switch Complete, or Wave 3 COMPLETE from this package
- Never need SSH to recover silently dropped in-flight delivery

---

## Consumes

| Product                           | How this package uses it                              | Must not do                     |
| --------------------------------- | ----------------------------------------------------- | ------------------------------- |
| **Authentication**                | Only signed-in operators access notification surfaces | Parallel login                  |
| **Authorization**                 | Only permitted roles may access                       | New IAM                         |
| **Workspace Isolation**           | Delivery / queue work stays in one workspace          | Cross-workspace convenience     |
| **Vault**                         | No local secret store; channel secrets remain Vault   | Duplicate store; echo plaintext |
| **Security Platform**             | Hardening and abuse/rate-limit defaults               | Fork platform controls          |
| **Security Audit**                | Attributable queue-relevant outcomes                  | Own the audit store             |
| **Notification product (NT-01)**  | Settings / routing / catalog remain existing owner    | Rewrite preferences product     |
| **notification-delivery owner**   | Persist / survive queue work on existing owner        | Invent second delivery product  |
| **W3-O01 CLOSED outcomes**        | Analytical history / prefs context; not redesigned    | Reopen O01; claim queue was O01 |
| **Wave 2 CLOSED products**        | Connections context available; not redesigned         | Reopen Connections ownership    |
| **Paper Outbox / Inbox (TD-035)** | Distinct — do not consume as this queue               | Merge / second Outbox           |

---

## Owns

| Outcome                                         | Customer meaning                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| Durable notification queue **outcomes**         | In-flight / pending / retryable delivery work survives API restart |
| No silent drop without record                   | Owed alerts are not wiped without durable record / honest failure  |
| Restart-survival honesty for delivery work      | No silent loss presented as success; no fake delivered             |
| Workspace-scoped notification delivery outcomes | A cannot use B’s queue / delivery surfaces                         |
| Attributable queue durability outcomes          | Emit to Security Audit where required                              |

**Does not own persistence as a new product.** Existing notification-delivery aggregate owner remains persistence owner.

---

## Does NOT own

| Concern                                       | Real owner                     |
| --------------------------------------------- | ------------------------------ |
| Secret ciphertext / encryption                | Vault                          |
| Identity / sessions                           | Authentication                 |
| Permissions                                   | Authorization                  |
| Workspace membership / isolation SoT          | Workspace / Isolation          |
| Security Platform defaults                    | Security Platform              |
| Audit persistence                             | Security Audit                 |
| Notification settings / routing product       | Existing NT-01 owner           |
| Production Telegram / SMTP / Slack transports | Wave 5 / V3-N01…N04            |
| Paper Outbox / Inbox                          | Existing Outbox owner (TD-035) |
| Analytical store durability outcomes          | W3-O01 (CLOSED)                |
| Kill Switch product                           | V3-O04                         |
| Monitoring & security health                  | V3-O05                         |
| US295 / ADL-008 stance                        | V3-O03                         |
| Live Trading                                  | Wave 6 / Order Path            |
| Connection Management                         | Wave 2 (COMPLETE)              |
| Canonical Order Path / Ledger                 | Existing owners                |

---

## IN Scope

| Item                          | Customer meaning                                          |
| ----------------------------- | --------------------------------------------------------- |
| Notification queue inventory  | In-flight / pending / retry surfaces known and classified |
| Durable notification queue    | Survive restart for owed in-flight delivery work          |
| Restart-survival proof        | Pending work present / resumed after API restart          |
| No silent drop without record | Honest failure / unavailable when required                |
| Workspace isolation           | A↛B                                                       |
| Authorization                 | Unauthorized deny                                         |
| Operator walkthrough          | Notification Durable Queue Walkthrough                    |
| Security boundaries           | Consume Wave 1 + Wave 2 + Closed O01; do not redefine     |
| Audit interaction             | Emit required queue durability outcomes                   |
| Failure philosophy            | Fail closed; no fake delivered                            |
| Validation strategy           | Close criteria, evidence, regressions                     |

---

## OUT OF Scope

Explicitly out of this package:

| Item                           | Declaration                          |
| ------------------------------ | ------------------------------------ |
| US295 / ADL-008 Complete       | **No O03**                           |
| Durable Kill Switch product    | **No O04**                           |
| Monitoring & security health   | **No O05**                           |
| Second Knowledge Lake          | **Forbidden**                        |
| Second Outbox                  | **Forbidden**                        |
| Merge with paper Outbox TD-035 | **Forbidden**                        |
| Wave 5 production transports   | **No Wave 5**                        |
| Live Trading                   | **No Live Trading**                  |
| Wave 4 venue I/O               | Out                                  |
| NT-01 settings/routing rewrite | Out                                  |
| W3-O01 redesign                | Out                                  |
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
Notification Durable Queue (W3-O02 / V3-O02)
        │ consumes
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Vault
        ├── Security Platform
        ├── Security Audit
        ├── Notification product (NT-01) — settings/routing
        ├── notification-delivery owner — extended only
        ├── Closed W3-O01 (context only)
        └── Closed Wave 2 products (context only)

Notification Durable Queue
        │ owns (product outcomes)
        ├── durable notification queue outcomes (NT-02)
        ├── no-silent-drop / honest failure outcomes
        ├── restart-survival honesty for in-flight delivery
        └── attributable queue outcomes (emit only)

Distinct (do not own / do not merge):
        ├── Paper Outbox / Inbox (TD-035)
        └── Wave 5 production transports
```

---

## Customer Journey

```text
Sign in
  ↓
Operate product such that an owed notification delivery is enqueued
  (in-process / certified path until Wave 5)
  ↓
API process restarts while delivery is in-flight / pending / retryable
  ↓
Delivery work is still present and resumes
  — or —
  Product records honest failure / unavailable
  (never silent drop without a record)
```

### Operator workflow

1. Sign in with an authorized role in a workspace.
2. Trigger or rely on an in-scope notification delivery path that creates pending / in-flight work.
3. Confirm work is attributable before restart (pending, history linkage, or equivalent operator-visible honesty).
4. Restart the API process before completion (validation / Close evidence).
5. Confirm work survived and resumes, or honest failure is recorded.
6. Confirm foreign workspace and unauthorized roles are denied.
7. Confirm no Wave 5 / Live Trading / Monitoring / Kill Switch / Wave 3 COMPLETE claims.

### Customer NEVER receives

- Silent disappearance of owed in-flight delivery presented as success
- Fake “delivered” when delivery did not complete
- Production Telegram / Email / Slack / Discord / Teams / Push from this package
- Live Trading enablement
- A second Outbox or merge with paper Outbox
- Another workspace’s notification delivery
- Plaintext secrets
- Claims of Monitoring Complete / Kill Switch Complete / Wave 3 COMPLETE from W3-O02
- Production restart-safety Complete from W3-O02 alone

---

## Honesty model

| Claim                                 | Meaning                                                           | Not meaning                                              |
| ------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| **Queue durable / survives restart**  | In-flight delivery work still available / resumable after restart | Wave 5 transports; Live Trading; Wave 3 COMPLETE         |
| **Honest failure / unavailable**      | Product records that delivery did not complete / channel down     | Silent wipe; fake delivered                              |
| **Notification Durable Queue Closed** | O02 acceptance evidenced                                          | O03…O05 Closed; Wave 5 Complete; restart-safety Complete |

---

## Failure philosophy

- Fail closed on missing auth / workspace / permission.
- Never present missing post-restart in-flight work as successfully delivered.
- Never invent success for unavailable channels / queue.
- Prefer survive + resume; failure only with explicit honesty / durable record.
- Secrets never echo.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                | Fail if            |
| --- | -------------------------------------------------------------------------------------- | ------------------ |
| 1   | In-scope in-flight notification delivery work survives API restart (or honest failure) | Silent loss        |
| 2   | No silent drop without a durable record                                                | Silent wipe        |
| 3   | No fake “delivered” when not delivered                                                 | Dishonest success  |
| 4   | Cross-workspace deny                                                                   | Leak               |
| 5   | Unauthorized deny                                                                      | Privilege bypass   |
| 6   | No Live Trading / Wave 5 Complete / Monitoring / Kill Switch / Wave 3 COMPLETE claims  | Dishonest claim    |
| 7   | No plaintext secret exposure                                                           | Exposure           |
| 8   | No second Lake / Outbox; TD-045 ≠ TD-035                                               | Architecture drift |

---

## Required implementation slices (planning only — not started)

| Slice    | Name                                                              |
| -------- | ----------------------------------------------------------------- |
| W3-O02-a | Notification queue inventory & honesty baseline                   |
| W3-O02-b | Durable queue persistence on existing notification-delivery owner |
| W3-O02-c | Restart-survival proof for in-flight delivery                     |
| W3-O02-d | Degraded delivery honesty & continuity alignment                  |
| W3-O02-e | Package Validation, Operational Verification & Close Evidence     |

Do not open these slices until Product Owner Approves planning and sequences implementation.

---

## Package boundaries & Dependencies

| Dependency          | Stance                                     |
| ------------------- | ------------------------------------------ |
| W3-O01 CLOSED       | Required predecessor; not redesigned       |
| Wave 1 / Wave 2     | Consumed; not modified                     |
| Wave 5 Notification | Depends on this queue later; not delivered |
| W3-O03…O05          | Sequenced after; not opened                |

---

## Future slices (a…e)

Named above. All **not opened** by this planning package.

---

## Mandatory Questions

1. **What business problem does W3-O02 solve?**
   In-flight notification delivery is process-local (TD-045). Restart can silently lose owed alerts even after analytical artifacts survive (W3-O01).

2. **Why is W3-O01 insufficient?**
   W3-O01 closed analytical-store survival (including delivery history). It explicitly left the Notification durable delivery queue to V3-O02. History ≠ queue.

3. **Which existing products does W3-O02 consume?**
   Authn, Authz, Isolation, Vault, Security Platform, Security Audit; Closed Wave 2; Closed W3-O01 context; existing Notification product (NT-01 + notification-delivery owner). Paper Outbox (TD-035) remains distinct.

4. **What does W3-O02 own?**
   NT-02 durable notification queue **outcomes** by extending the existing notification-delivery owner only — no new persistence owner.

5. **What is explicitly out of scope?**
   Wave 5 transports; O03–O05; second Lake/Outbox; merge with paper Outbox; Live Trading; Master Plan / Version 2 / Wave 1 / Wave 2 / W3-O01 modifications; ownership changes; implementation slices in this open; Wave 3 COMPLETE from planning.

6. **Does W3-O02 modify Wave 1?**
   No.

7. **Does W3-O02 modify Wave 2?**
   No.

8. **Does W3-O02 modify Version 2 architecture?**
   No.

---

**STOP.** Wait for Product Owner Planning Review before approving W3-O02 implementation. Do not create W3-O02-a from this document.
