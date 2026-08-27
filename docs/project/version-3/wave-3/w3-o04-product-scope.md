# W3-O04 Product Scope

**Package:** W3-O04 Durable Kill Switch Product
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O04 · LT-03 · TD-047
**Status:** Planning **COMPLETE**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w3-o04-implementation-package.md`](./w3-o04-implementation-package.md)
**Overview:** [`durable-kill-switch-overview.md`](./durable-kill-switch-overview.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **operator journey**, **failure philosophy**, and **acceptance** for W3-O04. It does not redesign Version 2 Runtime, Risk, or Session domains. It does not invent a second Kill Switch engine or runtime controller. It does not reopen Wave 1, Wave 2, W3-O01, W3-O02, or W3-O03. It does not revise the Master Plan. It does not introduce Live Trading or Monitoring. It does not claim Wave 3 COMPLETE.

**Naming clarity:** `W3-O04` is the operational package ID for Master Plan / Execution Roadmap **V3-O04**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory for LT-03 / TD-047.

---

## Product purpose

Durable Kill Switch Product is the operational safety capability that lets operators **arm** an emergency halt from the paper product, **see** that sessions stop, and **trust** that the armed state **survives restart** and **blocks evaluation/admission** on paper.

It is **not** a Monitoring Platform, Incident Management product, Business Continuity product, High Availability product, Disaster Recovery product, Workflow Engine, Scheduler, Retry Engine, Notification Platform, AI Platform, Risk Engine, Live Trading controller, or infrastructure orchestrator.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** redesign Risk Engine safety decisions or Runtime evaluator behaviour.

It does **not** own Monitoring (O05), Live Trading (Wave 6), or Telegram as Kill Switch owner.

```text
Existing Session / Command Center / Trading Session owners own Kill Switch substrate.
Durable Kill Switch Product owns LT-03 / TD-047 product outcomes on that ownership.
W3-O04 does NOT invent a new persistence owner, Kill Switch engine, or runtime controller.
Kill Switch Complete does NOT mean Live Trading enabled.
Kill Switch Complete does NOT mean Monitoring Complete (O05).
Kill Switch Complete does NOT mean Business Continuity / High Availability / Disaster Recovery.
Kill Switch Complete does NOT mean Wave 3 COMPLETE.
Pause / resume / stop alone do NOT mean Kill Switch Complete.
```

---

## Kill Switch Clarification (binding)

| Question                                              | Answer  |
| ----------------------------------------------------- | ------- |
| Does W3-O04 invent a second Kill Switch engine?       | **NO**  |
| Does W3-O04 introduce any new persistence owner?      | **NO**  |
| Does W3-O04 create a second runtime controller?       | **NO**  |
| Does W3-O04 redesign Risk Engine?                     | **NO**  |
| Must armed state survive API restart on paper?        | **YES** |
| Must armed state block evaluation/admission on paper? | **YES** |

Existing Session / Command Center ownership remains owner. Residual TD-047 vocabulary is not a new Source of Truth.

---

## Why Durable Kill Switch Product exists (business language)

Wave 1 closed Security Foundation. Wave 2 closed Connection Management. W3-O01 closed Durable Analytical Stores. W3-O02 closed Notification Durable Queue. W3-O03 closed Recovery Residual claim honesty.

None of those packages owned **visible, durable Kill Switch productization on paper**. Master Plan Wave 3 and Execution Roadmap V3-O04 name this outcome. TD-047 remains the residual. Hidden live-only REST is insufficient for paper operators.

---

## Why W3-O03 is insufficient (and why O04 follows O03)

W3-O03 closed production restart-safety **claim stance** honesty (US295 / ADL-008). It explicitly left Kill Switch product (O04) and Monitoring (O05) to later packages.

Recovery claim honesty is not the same as operational emergency halt productization. Without O04, operators still cannot visibly arm a durable Kill Switch on paper.

Order **O01 → O02 → O03 → O04 → O05** is binding.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Arm a Kill Switch from the paper product without live-trading surfaces or SSH
- See that sessions stop when the Kill Switch is armed
- Trust that armed state survives API restart
- Trust that evaluation/admission is blocked on paper while armed
- Clear the Kill Switch through an explicit, authorized, attributable action
- Stay inside their workspace and their authorization
- Never receive Live Trading, Monitoring Complete, BC/HA/DR, or Wave 3 COMPLETE from this package alone

---

## Consumes

| Product                       | How this package uses it                                 | Must not do                        |
| ----------------------------- | -------------------------------------------------------- | ---------------------------------- |
| **Authentication**            | Only signed-in operators access Kill Switch surfaces     | Parallel login                     |
| **Authorization**             | Only permitted roles may arm / clear                     | New IAM                            |
| **Workspace Isolation**       | Kill Switch state stays in one workspace                 | Cross-workspace convenience        |
| **Vault**                     | No local secret store                                    | Duplicate store; echo plaintext    |
| **Security Platform**         | Hardening and abuse/rate-limit defaults                  | Fork platform controls             |
| **Security Audit**            | Attributable arm / clear outcomes                        | Own the audit store                |
| **Trading Session**           | Session stop / halt semantics                            | Redesign lifecycle owner           |
| **Session / Command Center**  | Product facade; existing Kill Switch ownership           | Second Command Center domain       |
| **Runtime admission**         | Existing `kill_switch_active` gate                       | Bypass Gate/Risk/Kill Switch chain |
| **Existing Kill Switch REST** | Implementation lineage — not duplicated as competing SoT | Second Kill Switch REST product    |
| **Risk Engine**               | Safety context — consumed, not redesigned                | Become Risk Engine                 |
| **W3-O01 CLOSED outcomes**    | Durability context; not redesigned                       | Reopen O01                         |
| **W3-O02 CLOSED outcomes**    | Queue durability context; not redesigned                 | Reopen O02                         |
| **W3-O03 CLOSED outcomes**    | Recovery claim honesty context; not redesigned           | Reopen O03                         |
| **Wave 2 CLOSED products**    | Connections context; not redesigned                      | Reopen Connections ownership       |

---

## Owns

| Outcome                                     | Customer meaning                                                    |
| ------------------------------------------- | ------------------------------------------------------------------- |
| **LT-03 / TD-047 product outcomes**         | Visible, durable Kill Switch on paper                               |
| **Arm / clear operator product**            | Operator arms halt; sessions stop; clear is explicit and authorized |
| **Restart-surviving armed state**           | Armed Kill Switch still active after API restart                    |
| **Evaluation/admission block on paper**     | Armed state blocks paper evaluation/admission                       |
| **Workspace-scoped Kill Switch surfaces**   | A cannot use B’s Kill Switch                                        |
| **Attributable halt outcomes**              | Emit to Security Audit where required                               |
| **Honest Kill Switch Complete (O04 scope)** | Does not imply Monitoring, Live Trading, or Wave 3 COMPLETE         |

**Does not own persistence as a new product.** Existing Session / Command Center / Trading Session owners remain owners.

---

## Does NOT own

| Concern                              | Real owner                           |
| ------------------------------------ | ------------------------------------ |
| Secret ciphertext / encryption       | Vault                                |
| Identity / sessions                  | Authentication                       |
| Permissions                          | Authorization                        |
| Workspace membership / isolation SoT | Workspace / Isolation                |
| Security Platform defaults           | Security Platform                    |
| Audit persistence                    | Security Audit                       |
| Risk decisions                       | Risk Engine                          |
| Runtime evaluator / Order Path       | Existing runtime owners              |
| Recovery / US290–US294 substrate     | Trading Session / Runtime Recovery   |
| Monitoring / health dashboard        | V3-O05                               |
| Live capital / live orders           | Wave 6                               |
| Notification delivery                | Notification Delivery                |
| Telegram                             | Notification — not Kill Switch owner |
| Incident Management platform         | Out                                  |
| Business Continuity / HA / DR        | Out — not products in this package   |

---

## Scope IN

| Item                                     | Customer meaning                                      |
| ---------------------------------------- | ----------------------------------------------------- |
| Kill Switch inventory & honesty baseline | Existing surfaces known; pause/stop ≠ Complete        |
| Durable armed / cleared state            | Survives API restart on paper                         |
| Visible arm / clear on paper             | Operator product surfaces in Command Center pattern   |
| Session stop when armed                  | Operator sees sessions stop                           |
| Admission block while armed              | Evaluation/admission blocked on paper                 |
| Workspace isolation                      | A↛B                                                   |
| Authorization                            | Unauthorized deny                                     |
| Operator walkthrough                     | Durable Kill Switch Walkthrough                       |
| Security boundaries                      | Consume Wave 1 + Closed predecessors; do not redefine |
| Audit interaction                        | Emit required halt outcomes                           |
| Failure philosophy                       | Fail closed; no fake cleared while armed              |
| Validation strategy                      | Close criteria, evidence, regressions                 |

---

## OUT OF Scope

Explicitly out of this package:

| Item                              | Declaration                          |
| --------------------------------- | ------------------------------------ |
| Monitoring & security health      | **No O05**                           |
| Live Trading / live capital       | **No Wave 6**                        |
| Business Continuity product       | **No BC product**                    |
| High Availability product         | **No HA product**                    |
| Disaster Recovery product         | **No DR product**                    |
| Monitoring Platform               | **No Monitoring Platform**           |
| Incident Management platform      | **No Incident Management platform**  |
| Workflow Engine                   | **No Workflow Engine**               |
| Scheduler product                 | **No Scheduler**                     |
| Retry Engine product              | **No Retry Engine**                  |
| Notification Platform             | **No Wave 5 platform**               |
| AI Platform                       | **No Wave 7 platform**               |
| Risk Engine redesign              | **No Risk redesign**                 |
| Second Kill Switch engine         | **Forbidden**                        |
| Second runtime controller         | **Forbidden**                        |
| Second Knowledge Lake / Outbox    | **Forbidden**                        |
| Telegram as Kill Switch owner     | **Forbidden**                        |
| W3-O01 / W3-O02 / W3-O03 redesign | Out                                  |
| Wave 1 / Wave 2 redesign          | Out                                  |
| Master Plan changes               | Out                                  |
| Version 2 architecture changes    | Out                                  |
| Ownership changes                 | Out                                  |
| Implementation slices             | **Not opened in this planning task** |
| Wave 3 COMPLETE declaration       | Out                                  |

---

## Ownership (binding)

### Architecture consume diagram (planning)

```text
Durable Kill Switch Product (W3-O04 / V3-O04)
        │ consumes
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Vault
        ├── Security Platform
        ├── Security Audit
        ├── Trading Session — halt / session semantics
        ├── Session / Command Center — extended product facade only
        ├── Runtime admission kill_switch_active
        ├── Existing Kill Switch REST lineage (input — not duplicated)
        ├── Risk Engine — context only
        ├── Closed W3-O01 / W3-O02 / W3-O03 (context only)
        └── Closed Wave 2 products (context only)

Durable Kill Switch Product
        │ owns (product outcomes)
        ├── LT-03 / TD-047 durable Kill Switch outcomes
        ├── visible arm / clear on paper
        ├── restart-surviving armed state
        ├── evaluation/admission block on paper
        └── attributable halt outcomes (emit only)

Distinct (do not own / do not invent):
        ├── Risk Engine decisions
        ├── Monitoring product (O05)
        ├── Live Trading controller (Wave 6)
        └── Telegram
```

---

## Operator Journey

```text
Sign in with authorized role
  ↓
Open Command Center / operational safety surface
  ↓
Arm Kill Switch (with reason capture as required by existing ports)
  ↓
See sessions stop
  ↓
API process restarts
  ↓
Kill Switch still armed; sessions remain safely stopped;
evaluation/admission still blocked on paper
  ↓
Authorized operator clears Kill Switch explicitly
  (permission-documented; reconciliation gates per existing policy where applicable)
```

### Operator workflow

1. Sign in with an authorized role in a workspace.
2. Navigate to the in-scope Kill Switch product surface (Command Center pattern).
3. Arm Kill Switch with required reason / attribution.
4. Confirm sessions stop and admission is blocked on paper.
5. Restart the API process (validation / Close evidence).
6. Confirm armed state survived; sessions remain stopped; admission still blocked.
7. Clear Kill Switch through explicit authorized action.
8. Confirm foreign workspace and unauthorized roles are denied throughout.
9. Confirm no Monitoring / Live Trading / BC/HA/DR / Wave 3 COMPLETE claims.

### Customer NEVER receives

- Hidden-only Kill Switch on paper with no visible product control
- Silent loss of armed state on restart presented as success
- Fake “cleared” or “inactive” while armed state persists
- Live Trading enablement from this package
- Monitoring Complete / health dashboard from this package
- Business Continuity / High Availability / Disaster Recovery claims
- A second Kill Switch engine or parallel halt mechanism
- Another workspace’s Kill Switch state or control
- Plaintext secrets
- Telegram as Kill Switch owner
- Claims of Wave 3 COMPLETE from W3-O04 alone
- Production restart-safe Complete from W3-O04 alone

---

## Explicit Non-Claims

| Claim                            | W3-O04 stance                                           |
| -------------------------------- | ------------------------------------------------------- |
| Wave 3 COMPLETE                  | **Not claimed**                                         |
| Monitoring Complete              | **Not claimed**                                         |
| Live Trading enabled             | **Not claimed**                                         |
| Business Continuity product      | **Not claimed**                                         |
| High Availability product        | **Not claimed**                                         |
| Disaster Recovery product        | **Not claimed**                                         |
| Production restart-safe Complete | **Not claimed**                                         |
| Risk Engine Complete             | **Not claimed**                                         |
| AI Platform Complete             | **Not claimed**                                         |
| Kill Switch Complete (O04)       | **Target at Close only** — not claimed in planning open |

---

## Honesty model

| Claim                                | Meaning                                                            | Not meaning                               |
| ------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------- |
| **Kill Switch Complete (O04 scope)** | Visible, durable, restart-surviving halt on paper blocks admission | Live Trading; Monitoring; Wave 3 COMPLETE |
| **Sessions stop**                    | Trading sessions halt when armed                                   | Live order path enabled                   |
| **Armed survives restart**           | Halt state persists after API restart                              | BC/HA/DR product                          |
| **Durable Kill Switch Closed**       | O04 acceptance evidenced                                           | O05 Closed; Wave 6 live; Wave 3 COMPLETE  |

---

## Failure philosophy

- Fail closed on missing auth / workspace / permission.
- Never present cleared/inactive Kill Switch while armed state persists.
- Never bypass evaluation/admission while armed.
- Never invent success for unavailable runtime context.
- Prefer stop-safe behaviour; armed state overrides profit-seeking continuation on paper.
- Secrets never echo.
- Pause / resume / stop are not substitutes for honest Kill Switch Complete claims.

---

## Product Acceptance Criteria

| #   | Outcome                                                                   | Fail if             |
| --- | ------------------------------------------------------------------------- | ------------------- |
| 1   | Operator can arm Kill Switch on paper from visible product surface        | Hidden-only control |
| 2   | Sessions stop when Kill Switch is armed                                   | Sessions continue   |
| 3   | Armed state survives API restart on paper                                 | Silent loss         |
| 4   | Evaluation/admission blocked on paper while armed                         | Bypass              |
| 5   | Clear is explicit, authorized, and attributable                           | Silent clear        |
| 6   | Cross-workspace deny                                                      | Leak                |
| 7   | Unauthorized deny                                                         | Privilege bypass    |
| 8   | No Live Trading / Monitoring / BC/HA/DR / Wave 3 COMPLETE claims from O04 | Dishonest claim     |
| 9   | No plaintext secret exposure                                              | Exposure            |
| 10  | No second Kill Switch engine / runtime controller / persistence owner     | Architecture drift  |

---

## Required implementation slices (planning only — not started)

| Slice    | Name                                                           |
| -------- | -------------------------------------------------------------- |
| W3-O04-a | Kill Switch inventory & honesty baseline                       |
| W3-O04-b | Durable Kill Switch persistence on existing Session / CC owner |
| W3-O04-c | Paper product visibility & Command Center integration          |
| W3-O04-d | Restart survival & admission block proof                       |
| W3-O04-e | Package Validation, Operational Verification & Close Evidence  |

Do not open these slices until Product Owner Approves planning and sequences implementation.

---

## Package boundaries & Dependencies

| Dependency          | Stance                                   |
| ------------------- | ---------------------------------------- |
| W3-O03 CLOSED       | Required predecessor; not redesigned     |
| W3-O01 / W3-O02     | Required context; not redesigned         |
| Wave 1 / Wave 2     | Consumed; not modified                   |
| W3-O05 Monitoring   | Sequenced after; not delivered           |
| Wave 6 Live Trading | Reuses same control later; not delivered |

---

## Mandatory Questions

1. **What business problem does W3-O04 solve?**
   Kill Switch is live-only and hidden on paper (TD-047). Operators cannot visibly arm a durable halt, see sessions stop, or trust armed state survives restart and blocks evaluation/admission.

2. **Why is W3-O04 sequenced after W3-O03?**
   Binding order **O01 → O02 → O03 → O04 → O05**. W3-O03 closed recovery-claim stance honesty. Durability foundations precede Kill Switch productization and Monitoring.

3. **Which existing packages does W3-O04 consume?**
   Authentication, Authorization, Workspace Isolation, Vault, Security Platform, Security Audit; Closed Wave 2; Closed W3-O01 / W3-O02 / W3-O03; Session / Command Center / Trading Session; existing Kill Switch REST lineage; Runtime admission; Risk Engine context.

4. **What does W3-O04 own?**
   LT-03 / TD-047 durable Kill Switch product outcomes on existing Session / Command Center ownership only.

5. **What is explicitly OUT of scope?**
   O05; Live Trading; BC/HA/DR; Monitoring Platform; Incident Management; Workflow/Scheduler/Retry/Notification/AI platforms; Risk redesign; second Kill Switch engine; Master Plan / Version 2 / predecessor modifications; ownership changes; implementation slices; Wave 3 COMPLETE.

6. **Does W3-O04 modify Version 2?**
   No.

7. **Does W3-O04 modify Wave 1, Wave 2, or completed Wave 3 packages?**
   No.

8. **Does W3-O04 introduce new ownership?**
   No.

9. **Does W3-O04 introduce a new bounded context?**
   No.

10. **Does W3-O04 introduce a new Source of Truth?**
    No.

---

**STOP.** Planning only. Awaiting Product Owner Review. Do not open W3-O04-a. Do not approve the package from this document alone.
