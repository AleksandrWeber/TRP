# W3-O03 Product Scope

**Package:** W3-O03 Recovery Residual (US295 / ADL-008)
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O03 · IN-02 · TD-036 (R6 / US295)
**Status:** Planning **COMPLETE**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w3-o03-implementation-package.md`](./w3-o03-implementation-package.md)
**Overview:** [`recovery-residual-overview.md`](./recovery-residual-overview.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W3-O03. It does not redesign Version 2 Recovery domains. It does not invent a second Lake, Outbox, or recovery product. It does not reopen Wave 1, Wave 2, W3-O01, or W3-O02. It does not revise the Master Plan. It does not introduce Live Trading, Kill Switch product, or Monitoring. It does not claim Wave 3 COMPLETE.

**Naming clarity:** `W3-O03` is the operational package ID for Master Plan / Execution Roadmap **V3-O03**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory for IN-02 / TD-036 R6.

---

## Product purpose

Recovery Residual is the product package that defines how **production restart-safety claims** are either **accepted** (ADL-008 ACCEPTED, evidence-synchronized) or **explicitly limited** in writing — never a silent “production restart-safe” PASS.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspaces. Workspace owns membership; Isolation proves the boundary.

It does **not** own security platform defaults or audit persistence.

It does **not** redesign Runtime Recovery / Trading Session / RecoveryState / Incident behaviour (US290–US294 closed).

It does **not** own Kill Switch product (O04), Monitoring (O05), Live Trading, Wave 4 venue I/O, or Wave 5 transports.

```text
Existing Runtime Recovery / Session / ADL owners own recovery substrate and log.
Recovery Residual owns accept-or-limit claim stance outcomes for IN-02 / US295.
W3-O03 does NOT invent a new persistence owner or recovery domain.
Stance closed does NOT mean Live Trading enabled.
Stance closed does NOT mean Kill Switch Complete (O04).
Stance closed does NOT mean Monitoring Complete (O05).
Stance closed does NOT mean Business Continuity / High Availability.
Stance closed does NOT mean Wave 3 COMPLETE.
```

---

## Recovery Clarification (binding)

| Question                                             | Answer |
| ---------------------------------------------------- | ------ |
| Does W3-O03 redesign US290–US294 recovery behaviour? | **NO** |
| Does W3-O03 introduce any new persistence owner?     | **NO** |
| Does W3-O03 create a second recovery product?        | **NO** |
| Is silent “production restart-safe” PASS allowed?    | **NO** |

Existing Runtime Recovery / Architecture Decision Log owners remain owners. Residual US295 / ADL-008 vocabulary is not a new Source of Truth.

---

## Authority

**Binding governance for ADL-008 disposition:**

| Rule                    | Binding                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engineering role        | Engineering implements **evidence only** (inventory, evidence-chain sync, honesty surfaces, Close Evidence preparation).                                                  |
| Disposition authority   | **Product Owner** is the **only** authority that decides whether ADL-008 becomes **ACCEPTED** or remains **DEFERRED** with an **explicit written live-claim limitation**. |
| Engineering prohibition | Engineering must **never** self-promote ADL-008 to ACCEPTED.                                                                                                              |
| Package boundary        | Package implementation may **prepare evidence** but may **not** make the governance decision.                                                                             |

“ADL-008 ACCEPTED or explicit written limitation” is a **Product Owner governance outcome**, not an Engineering self-service path.

---

## Why Recovery Residual exists (business language)

Wave 1 closed Security Foundation. Wave 2 closed Connection Management. W3-O01 closed Durable Analytical Stores. W3-O02 closed Notification Durable Queue.

None of those packages owned the **production restart-safety claim stance** for ADL-008 / US295. Master Plan Wave 3 and Execution Roadmap V3-O03 name this outcome. TD-036 R6 remains the residual. Silent PASS is forbidden.

---

## Why W3-O02 is insufficient (and why O03 follows O02)

W3-O02 made owed in-flight notification delivery survive restart. It explicitly left US295 / ADL-008 stance to V3-O03.

Queue durability is not the same as authorizing a “production restart-safe” claim for the recovery algorithm. Without O03, restart-safety language can remain silent or ambiguous after durability foundations land.

Order **O01 → O02 → O03 → O04 → O05** is binding.

---

## Customer value

After this package Closes (post-implementation), an operator / Product Owner can:

- Rely on an honest production restart-safety stance: ACCEPTED **or** explicit written limitation
- Never treat a DEFERRED placeholder as silent PASS
- Stay inside their workspace and their authorization (for any product surfaces)
- Never receive Live Trading, Kill Switch Complete, Monitoring Complete, BC/HA, or Wave 3 COMPLETE from this package
- Never need SSH to discover that restart-safety was silently assumed

---

## Consumes

| Product                        | How this package uses it                                | Must not do                                     |
| ------------------------------ | ------------------------------------------------------- | ----------------------------------------------- |
| **Authentication**             | Only signed-in operators access claim / stance surfaces | Parallel login                                  |
| **Authorization**              | Only permitted roles may access                         | New IAM                                         |
| **Workspace Isolation**        | Claim surfaces stay in one workspace                    | Cross-workspace convenience                     |
| **Vault**                      | No local secret store                                   | Duplicate store; echo plaintext                 |
| **Security Platform**          | Hardening and abuse/rate-limit defaults                 | Fork platform controls                          |
| **Security Audit**             | Attributable stance / limitation outcomes               | Own the audit store                             |
| **Runtime Recovery / Session** | Existing US290–US294 substrate as evidence inputs       | Redesign recovery algorithms                    |
| **Architecture Decision Log**  | ADL-008 disposition on existing ADL ownership           | Invent second decision log                      |
| **W3-O01 CLOSED outcomes**     | Analytical durability context; not redesigned           | Reopen O01                                      |
| **W3-O02 CLOSED outcomes**     | Queue durability context; not redesigned                | Reopen O02; claim queue = restart-safe Complete |
| **Wave 2 CLOSED products**     | Connections context available; not redesigned           | Reopen Connections ownership                    |

---

## Owns

| Outcome                                   | Customer meaning                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| US295 / ADL-008 **claim stance outcomes** | ACCEPTED **or** explicit accepted deferral / written live-claim limitation |
| No silent production restart-safety PASS  | DEFERRED placeholder cannot authorize restart-safe language                |
| Evidence-grounded honesty                 | Accept path cites required US290–US294 / US294 Evidence Package inputs     |
| Workspace-scoped claim surfaces (if any)  | A cannot use B’s stance surfaces                                           |
| Attributable stance outcomes              | Emit to Security Audit where required                                      |

**Does not own persistence as a new product.** Existing recovery / ADL owners remain owners.

---

## Does NOT own

| Concern                              | Real owner                                       |
| ------------------------------------ | ------------------------------------------------ |
| Secret ciphertext / encryption       | Vault                                            |
| Identity / sessions                  | Authentication                                   |
| Permissions                          | Authorization                                    |
| Workspace membership / isolation SoT | Workspace / Isolation                            |
| Security Platform defaults           | Security Platform                                |
| Audit persistence                    | Security Audit                                   |
| Recovery algorithm / reconcile ports | Trading Session / Runtime Recovery (US290–US294) |
| RecoveryState / Incident substrate   | Existing recovery owners                         |
| Analytical store durability outcomes | W3-O01 (CLOSED)                                  |
| Notification durable queue outcomes  | W3-O02 (CLOSED)                                  |
| Kill Switch product                  | V3-O04                                           |
| Monitoring & security health         | V3-O05                                           |
| Live Trading                         | Wave 6 / Order Path                              |
| Connection Management                | Wave 2 (COMPLETE)                                |
| Canonical Order Path / Ledger        | Existing owners                                  |
| E19 operator recovery UX             | Later operational productization                 |

---

## IN Scope

| Item                          | Customer meaning                                                |
| ----------------------------- | --------------------------------------------------------------- |
| Recovery residual inventory   | Claim surfaces / ADL-008 / US295 inputs known and classified    |
| ADL-008 disposition           | ACCEPTED **or** explicit accepted deferral / written limitation |
| No silent restart-safety PASS | Master Plan disaster-recovery claim rule                        |
| Evidence-chain honesty        | Accept path grounded in US290–US294 evidence                    |
| Workspace isolation           | A↛B                                                             |
| Authorization                 | Unauthorized deny                                               |
| Operator walkthrough          | Recovery Residual Walkthrough                                   |
| Security boundaries           | Consume Wave 1 + Wave 2 + Closed O01/O02; do not redefine       |
| Audit interaction             | Emit required stance outcomes                                   |
| Failure philosophy            | Fail closed; no fake restart-safe                               |
| Validation strategy           | Close criteria, evidence, regressions                           |

---

## OUT OF Scope

Explicitly out of this package:

| Item                              | Declaration                          |
| --------------------------------- | ------------------------------------ |
| Durable Kill Switch product       | **No O04**                           |
| Monitoring & security health      | **No O05**                           |
| US290–US294 redesign              | **Forbidden**                        |
| Second Knowledge Lake             | **Forbidden**                        |
| Second Outbox / second recovery   | **Forbidden**                        |
| Business Continuity / HA products | **Out**                              |
| E19 recovery dashboard UX         | **Out**                              |
| Live Trading                      | **No Live Trading**                  |
| Wave 4 venue I/O                  | Out                                  |
| Wave 5 production transports      | Out                                  |
| W3-O01 / W3-O02 redesign          | Out                                  |
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
Recovery Residual (W3-O03 / V3-O03)
        │ consumes
        ├── Authentication
        ├── Authorization
        ├── Workspace Isolation
        ├── Vault
        ├── Security Platform
        ├── Security Audit
        ├── Runtime Recovery / Trading Session (US290–US294 substrate)
        ├── Architecture Decision Log (ADL-008 disposition)
        ├── Closed W3-O01 (context only)
        ├── Closed W3-O02 (context only)
        └── Closed Wave 2 products (context only)

Recovery Residual
        │ owns (product outcomes)
        ├── US295 / ADL-008 claim stance outcomes (IN-02)
        ├── no-silent-PASS / accept-or-limit honesty
        ├── evidence-grounded accept path (or explicit limitation)
        └── attributable stance outcomes (emit only)

Distinct (do not own / do not redesign):
        ├── US290–US294 recovery behaviour
        ├── Kill Switch product (O04)
        └── Monitoring product (O05)
```

---

## Customer Journey

```text
Sign in
  ↓
Operate / review production restart-safety claim posture
  ↓
Product (and governed package Close) shows either:
  ADL-008 ACCEPTED (evidence-synchronized)
  — or —
  Explicit written live-claim limitation
  ↓
Never a silent “production restart-safe” PASS
  while residual was unexamined DEFERRED
```

### Operator workflow

1. Sign in with an authorized role in a workspace.
2. Locate restart-safety / recovery claim stance honesty (product surface and/or package Close linkage).
3. Confirm stance is ACCEPTED **or** explicit written limitation.
4. Confirm accept path cites required evidence inputs, **or** limitation explicitly states what is not claimed.
5. Confirm foreign workspace and unauthorized roles are denied (for any UI).
6. Confirm no Live Trading / Kill Switch Complete / Monitoring Complete / BC/HA / Wave 3 COMPLETE claims.

### Customer NEVER receives

- Silent “production restart-safe” PASS while ADL-008 was DEFERRED
- Fake acceptance without evidence grounding (when ACCEPTED path is chosen)
- Redesign of US290–US294 recovery as if this package owned algorithm delivery
- Live Trading enablement
- Kill Switch Complete / Monitoring Complete from this package
- Another workspace’s claim surfaces
- Plaintext secrets
- Claims of Business Continuity / High Availability / Wave 3 COMPLETE from W3-O03

---

## Honesty model

| Claim                              | Meaning                                                                   | Not meaning                                   |
| ---------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| **ADL-008 ACCEPTED**               | Decision log synchronized; production recovery claim authorized as scoped | Live Trading; Wave 3 COMPLETE; BC/HA          |
| **Explicit live-claim limitation** | Written limitation of what restart-safety is **not** claimed              | Silent DEFERRED; fake Complete                |
| **Recovery Residual Closed**       | O03 acceptance evidenced                                                  | O04…O05 Closed; Live Trading; Wave 3 COMPLETE |

---

## Failure philosophy

- Fail closed on missing auth / workspace / permission.
- Never present DEFERRED ADL-008 as production restart-safe Complete.
- Never invent ACCEPTED without required evidence grounding when that path is chosen.
- Prefer explicit limitation over silent PASS when acceptance is not warranted.
- If evidence is insufficient to justify ACCEPTED, Product Owner records an explicit written live-claim limitation — evidence must never be invented to achieve ACCEPTED.
- Engineering never self-promotes ADL-008 to ACCEPTED.
- Secrets never echo.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                                                                                                                    | Fail if                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| 1   | ADL-008 ACCEPTED **or** explicit written live-claim limitation                                                                                                                             | Silent PASS                                         |
| 2   | No silent “production restart-safe” while residual open                                                                                                                                    | Dishonest claim                                     |
| 3   | Accept path evidence-grounded (or limitation explicit)                                                                                                                                     | Evidence-free accept                                |
| 4   | Cross-workspace deny (if UI)                                                                                                                                                               | Leak                                                |
| 5   | Unauthorized deny                                                                                                                                                                          | Privilege bypass                                    |
| 6   | No Live Trading / Kill Switch Complete / Monitoring / BC/HA / Wave 3 COMPLETE claims                                                                                                       | Dishonest claim                                     |
| 7   | No plaintext secret exposure                                                                                                                                                               | Exposure                                            |
| 8   | No second Lake / Outbox / recovery domain; US290–US294 ownership unchanged                                                                                                                 | Architecture drift                                  |
| 9   | If available evidence is insufficient to justify ACCEPTED, the required outcome is an **explicit written live-claim limitation**. Evidence must **never** be invented to achieve ACCEPTED. | Invented evidence; forced ACCEPTED; silent fallback |

**Authority note:** Criteria 1 and 9 are Product Owner disposition outcomes. Engineering prepares evidence; Engineering does not decide ACCEPTED.

---

## Required implementation slices (planning only — not started)

| Slice    | Name                                                          |
| -------- | ------------------------------------------------------------- |
| W3-O03-a | Recovery residual inventory & claim-language baseline         |
| W3-O03-b | Evidence-chain sync for US295 inputs                          |
| W3-O03-c | ADL-008 disposition (ACCEPTED or explicit deferral)           |
| W3-O03-d | Live-claim limitation / honesty alignment                     |
| W3-O03-e | Package Validation, Operational Verification & Close Evidence |

Do not open these slices until Product Owner Approves planning and sequences implementation.

---

## Package boundaries & Dependencies

| Dependency      | Stance                                            |
| --------------- | ------------------------------------------------- |
| W3-O02 CLOSED   | Required predecessor; not redesigned              |
| W3-O01 CLOSED   | Required context; not redesigned                  |
| Wave 1 / Wave 2 | Consumed; not modified                            |
| US290–US294     | Closed substrate; evidence inputs; not redesigned |
| W3-O04…O05      | Sequenced after; not opened                       |

---

## Future slices (a…e)

Named above. All **not opened** by this planning package.

---

## Mandatory Questions

1. **What business problem does W3-O03 solve?**
   ADL-008 remains DEFERRED / US295 open after US290–US294 closed substrate and chaos evidence, allowing silent or ambiguous “production restart-safe” claims that Master Plan forbids.

2. **Why is this package sequenced after W3-O02?**
   Binding order **O01 → O02 → O03 → O04 → O05**. W3-O02 closed queue durability and left US295 / ADL-008 stance to V3-O03. Durability foundations precede claim honesty for production restart-safety.

3. **Which existing packages does W3-O03 consume?**
   Authn, Authz, Isolation, Vault, Security Platform, Security Audit; Closed Wave 2; Closed W3-O01; Closed W3-O02; existing Runtime Recovery / Session / ADL ownership with US290–US294 evidence.

4. **What does W3-O03 own?**
   IN-02 / US295 / ADL-008 claim stance **outcomes** (ACCEPTED or explicit written live-claim limitation) on existing ownership only — no new persistence owner.

5. **What is explicitly out of scope?**
   O04–O05; US290–US294 redesign; Live Trading; BC/HA; Master Plan / Version 2 / Wave 1 / Wave 2 / W3-O01 / W3-O02 modifications; ownership changes; implementation slices in this open; Wave 3 COMPLETE from planning.

6. **Does this package modify Version 2?**
   No.

7. **Does this package modify Wave 1 or Wave 2?**
   No.

8. **Does this package introduce architectural or ownership changes?**
   No.

---

**STOP.** Wait for Product Owner Planning Review before approving W3-O03 implementation. Do not create W3-O03-a from this document.
