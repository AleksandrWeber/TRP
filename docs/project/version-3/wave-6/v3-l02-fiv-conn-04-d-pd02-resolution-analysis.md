# FIV-CONN-04-D P-D-02 Resolution Analysis — Blocker Options (No Selection)

**Document:** FIV-CONN-04-D — P-D-02 Blocker Analysis & Resolution Options  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Related disposition:** [`v3-l02-fiv-conn-04-d-pd02-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-disposition.md) (**untouched** by this artifact)  
**Authority:** Governance-level analysis only  
**Nature:** **INFORMATION / OPTIONS ONLY.** Does **not** select, rank, or recommend an option. Does **not** invent an `actorId`. Does **not** implement D. Does **not** modify production code, audit schemas, D implementation planning, or the P-D-02 disposition artifact. Does **not** dispose P-D-03. Does **not** grant D Implementation Authorization. Does **not** commit or push.

**Repository baseline:** `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd` (`HEAD` = `origin/main`)  
**P-D-01:** DELIVERED at that commit  
**P-D-02 discovery disposition:** **BLOCKED — CONCRETE PROVENANCE NOT ESTABLISHED**

```text
THIS ARTIFACT DOES NOT CLOSE P-D-02.
THIS ARTIFACT DOES NOT SELECT AN OPTION.
NO COMMIT/PUSH PERFORMED
```

---

## 1. Executive Finding

P-D-02 remains blocked because the repository establishes the **shape** of a privileged actor (`PrivilegedActorContext` with `SYSTEM_JOB` | `OPERATOR`) and the **plumbing** to accept a caller-supplied actor into B-04 and Security Audit `attribution.actorId`, but does **not** establish an **authoritative source** that produces a concrete, auditable `actorId` for the D privileged orchestrator.

No existing authoritative D `actorId` was found. Ordinary Connections HTTP `request.user.userId` is an established identity source for **non-privileged** Connections paths only. Lease purpose `FIV_CONN_04_MIGRATION_BACKFILL` is not an actor identity. Test fixture IDs are not authoritative.

`actorKind` is **not** persisted on Security Audit attribution. It **is** persisted on the migration-gate lease row. Slice §13 already allows `actorId` / `systemJobId` in durable event **payload**. Whether that combination satisfies frozen audit substance without attribution-schema change is a **governance clarification**, not a substitute for provenance.

Multiple legitimate resolution paths exist. **None are selected here.** P-D-02 stays **BLOCKED** until an explicit governance decision binds authoritative actor provenance.

---

## 2. Frozen P-D-02 Requirement

| Element                                           | Status                     | Content                                                                                                 |
| ------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| Actor kinds                                       | **FROZEN**                 | `SYSTEM_JOB` \| `OPERATOR` only; `CLIENT` forbidden                                                     |
| Representation                                    | **FROZEN**                 | `PrivilegedActorContext = { actorId; actorKind; correlationId? }`                                       |
| B-04                                              | **FROZEN**                 | D start/resume/heartbeat/release must use B-04 with privileged context                                  |
| Anti-spoofing                                     | **FROZEN**                 | No public HTTP for B-04; trusted invocation boundary constructs actor; no client-controlled grant/fence |
| Concrete `actorId` provenance                     | **UNRESOLVED / BLOCKING**  | Must be concrete and auditable; must **not** be invented merely to satisfy the type                     |
| D execution model (Impl Planning)                 | **PROPOSED / non-binding** | Privileged Nest/service path — not public HTTP API; not automatically authorized cron                   |
| Audit substance (Slice §13 / COND-D-02 substance) | **FROZEN**                 | Durable attributable events; payload may include `actorId` / `systemJobId`; no secrets                  |
| NB-01 event type                                  | **Separate (P-D-03)**      | Not disposed by P-D-02                                                                                  |

---

## 3. Repository Evidence

| Fact                                          | Evidence                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Privileged kinds/types exist                  | `apps/api/src/modules/connections/migration-gate.ts`                                                      |
| B-04 requires caller-supplied actor           | `conn04-migration-boundary.service.ts` — validates then forwards; no identity factory                     |
| No production B-04 callers                    | Only specs invoke `Conn04MigrationBoundaryService`                                                        |
| No production privileged-actor constructor    | Non-test code has no concrete `SYSTEM_JOB`/`OPERATOR` identity literals                                   |
| Lease stores `actorKind`                      | `prisma-migration-gate.adapter.ts` + Prisma `actorKind` on lease                                          |
| Security Audit attribution has no `actorKind` | `security-audit-record.ts`; `rg actorKind` under `security-audit/` = empty                                |
| Gate audits use string `actorId`              | `connection-migration-gate-audit.ts`; attribution rule requires `actorId` for `connection.migration-gate` |
| HTTP user pattern (non-D)                     | `connections.controller.ts` → `request.user.userId` → lifecycle/validation audits                         |
| Purpose ≠ actor                               | `MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL`                                                   |
| Discovery disposition                         | [`v3-l02-fiv-conn-04-d-pd02-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-disposition.md)                  |

---

## 4. Exact Missing Contract

P-D-02 is missing a **binding provenance tuple**, not a TypeScript type:

```text
MISSING (authoritative):
  1. Trusted D invocation boundary (who/what may call B-04 + D orchestrator)
  2. Kind binding for that boundary: OPERATOR and/or SYSTEM_JOB
  3. Exact actorId source rule for that boundary
       (e.g. authenticated subject field X, or ops-bound job identity string Y)
  4. Rule that the same actorId/correlationId flows into:
       - PrivilegedActorContext for B-04
       - Security Audit attribution.actorId for D durable events
       - (as applicable) lease holderId and Slice payload actorId/systemJobId
  5. Explicit statement that the chosen source is not HTTP-client-spoofable
     and is not invented solely to pass isPrivilegedActorContext
```

**What already exists (insufficient alone):** type guard, B-04 accept/refuse, lease `actorKind` column, Security Audit `actorId` string attribution, Slice payload field allowance.

**Answers to discovery questions (concise):**

| #   | Question                                                                   | Answer                                                                                                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | What exactly is missing?                                                   | Authoritative provenance tuple above (§4)                                                                                                                                                                                                                                                          |
| 2   | Existing authoritative identity source for D without new identity?         | **No** D-authoritative source found. HTTP `userId` exists for ordinary Connections only                                                                                                                                                                                                            |
| 3   | Can SYSTEM_JOB use an existing stable service/job identity?                | **No CONN-04-authoritative identity found.** Using an unrelated domain string would be false attribution, not legitimate reuse. A CONN-04 SYSTEM_JOB path would require introducing/ratifying a **new canonical** job identity (or an external ops registry entry treated as new for this product) |
| 4   | Could OPERATOR be used?                                                    | **Yes, only if** D’s trusted invocation boundary supplies an **authenticated operator subject** as `actorId` with `actorKind: 'OPERATOR'`. Today that D boundary **does not exist** in code. Ordinary Connections HTTP is **not** automatically that boundary                                      |
| 5   | Is `actorKind` in Security Audit?                                          | **No.** D can potentially satisfy frozen _attribution_ using existing `actorId`-only attribution **if** `actorId` is honest and kind remains recoverable (lease and/or payload). Whether that is acceptable **requires governance clarification**                                                  |
| 6   | Does proposed Nest orchestrator have enough infrastructure for provenance? | **Plumbing: yes (partial).** **Provenance: no.** Still need trusted constructor + bound identity source before D can honestly call B-04                                                                                                                                                            |
| 7   | Legitimate resolution options?                                             | See §5 (no selection)                                                                                                                                                                                                                                                                              |

---

## 5. Resolution Options

**Legend:** Options below are **unordered**. No preference is expressed.

### 5.A Provenance options (can close P-D-02 if ratified)

#### OPT-PD02-01 — OPERATOR via authenticated operator subject at a trusted non-public boundary

| Field                                          | Content                                                                                                                                                                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idea                                           | Bind D invocation such that `actorKind = OPERATOR` and `actorId = <authenticated operator subject id>` from a trusted boundary (not ordinary public Connections env API)                                                                        |
| Where identity would come from                 | The authenticated principal available **at that boundary** (e.g. internal privileged entry that already holds a verified operator `userId` / subject id). Exact mechanism is for governance to define; it is **not** present as a D entry today |
| Required repository change (future, if chosen) | D trusted entry that receives/constructs `PrivilegedActorContext` from authenticated operator subject; still no public B-04 HTTP                                                                                                                |
| Introduces new canonical identity?             | **No** (uses existing Identity subject ids). Does introduce a **new invocation binding** for D                                                                                                                                                  |
| Changes security/audit contract?               | **No schema change required** for attribution (`actorId` string remains). Kind on lease already supported                                                                                                                                       |
| Changes D frozen contract?                     | **No** if stays within `OPERATOR` + no public B-04. **Yes / Freeze revisit** if it implies a public HTTP env-mutation surface                                                                                                                   |
| Ops / auditability                             | Per-run attribution to a real human/service account subject; investigation can join Identity                                                                                                                                                    |
| Security                                       | Depends entirely on authenticity of the boundary; spoofed operator ids remain forbidden                                                                                                                                                         |

#### OPT-PD02-02 — SYSTEM_JOB via newly ratified canonical job identity

| Field                                          | Content                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idea                                           | Governance + ops ratify a stable CONN-04 backfill job identity string; D constructs `{ actorKind: 'SYSTEM_JOB', actorId: <ratified string> }` at trusted internal entry |
| Required repository change (future, if chosen) | Constant/registry reference to the **ratified** string; trusted constructor; ops runbook binding                                                                        |
| Introduces new canonical identity?             | **Yes** (no existing CONN-04 job actor found)                                                                                                                           |
| Changes security/audit contract?               | **No** attribution schema change required if `actorId` carries the job string; optional payload `systemJobId` per Slice §13                                             |
| Changes D frozen contract?                     | **No** if kind remains `SYSTEM_JOB` and entry remains non-public / not auto-cron unless separately authorized                                                           |
| Ops / auditability                             | Stable machine identity across runs; less per-human attribution unless correlationId / ops logs compensate                                                              |
| Security                                       | Identity must be ops-controlled and not client-settable; inventing without ops ratification recreates the P-D-02 violation                                              |

#### OPT-PD02-03 — Dual-mode provenance (both kinds allowed; each path bound)

| Field                                          | Content                                                                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Idea                                           | Explicitly allow both OPERATOR and SYSTEM_JOB invocation modes for D, each with its own authoritative `actorId` source rule |
| Required repository change (future, if chosen) | Two trusted constructors / entry modes; shared B-04 + audit plumbing                                                        |
| Introduces new canonical identity?             | **SYSTEM_JOB leg: yes** (unless an authoritative job identity is later found). **OPERATOR leg: no** (subject ids)           |
| Changes security/audit contract?               | Not necessarily; both still emit `attribution.actorId`                                                                      |
| Changes D frozen contract?                     | **No** — frozen kinds already allow both. Clarifies previously unbound ops mapping                                          |
| Ops / auditability                             | Must prevent ambiguous “which mode ran?” via `actorKind` on lease and/or payload                                            |
| Security                                       | Doubles the attack surface of entry paths; each path needs anti-spoofing                                                    |

#### OPT-PD02-04 — External ops identity registry / runbook as provenance SoT

| Field                                          | Content                                                                                                                                                                                                         |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idea                                           | Governance ratifies that authoritative D actor identity lives in an **ops registry/runbook** (outside inventing a throwaway code literal in discovery). Implementation later consumes only the ratified binding |
| Required repository change (future, if chosen) | Eventually a read of the bound identity into `PrivilegedActorContext`; may be OPERATOR subject list and/or SYSTEM_JOB string                                                                                    |
| Introduces new canonical identity?             | **Possibly** (if registry creates a new job id). **Possibly not** (if registry only names existing operator subjects)                                                                                           |
| Changes security/audit contract?               | No by itself                                                                                                                                                                                                    |
| Changes D frozen contract?                     | **No** if kinds unchanged; establishes the missing ops mapping COND-D-03 called out                                                                                                                             |
| Ops / auditability                             | Provenance SoT is operational; code must not drift from registry                                                                                                                                                |
| Security                                       | Registry compromise / drift becomes security-critical; needs change control                                                                                                                                     |

### 5.B Companion options (actorKind recording — do **not** alone close P-D-02)

#### OPT-PD02-C1 — Record kind via existing lease + Slice payload; keep attribution `actorId`-only

| Field                              | Content                                                                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idea                               | Treat Security Audit attribution as `actorId`-only (current contract). Rely on migration-gate lease `actorKind` and/or D event payload `actorId`/`systemJobId` for kind discrimination |
| Required repository change         | None to Security Audit schema; D audit helper would populate allowed payload fields (after P-D-03 type decision)                                                                       |
| Introduces new canonical identity? | **No**                                                                                                                                                                                 |
| Changes security/audit contract?   | **No** schema change; **interpretation clarification** of frozen audit substance                                                                                                       |
| Changes D frozen contract?         | **No** if Slice §13 payload fields are used as already allowed                                                                                                                         |
| Closes P-D-02?                     | **No** — still needs authoritative `actorId` source                                                                                                                                    |
| Governance                         | Clarification may be recordable in Implementation Planning **if** PO accepts that kind need not be an attribution column                                                               |

#### OPT-PD02-C2 — Extend Security Audit attribution to persist `actorKind`

| Field                              | Content                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Idea                               | Add `actorKind` (or equivalent) to Security Audit attribution schema + rules                    |
| Required repository change         | Attribution type, normalization rules, possibly persistence/mapper, classification/docs         |
| Introduces new canonical identity? | **No**                                                                                          |
| Changes security/audit contract?   | **Yes**                                                                                         |
| Changes D frozen contract?         | Not the kind enum; **adds** a recording requirement beyond current migration-gate audit pattern |
| Closes P-D-02?                     | **No** — still needs authoritative `actorId`                                                    |
| Governance                         | Likely needs explicit Security / Decision Freeze attention (cross-cutting audit contract)       |

---

## 6. Contract / Security Impact of Each Option

| Option      | New identity?       | Audit schema change?  | Frozen D kind contract change? | Security impact summary                                           |
| ----------- | ------------------- | --------------------- | ------------------------------ | ----------------------------------------------------------------- |
| OPT-PD02-01 | No (subjects)       | No                    | No*                            | Authenticates human/service operator; boundary integrity critical |
| OPT-PD02-02 | Yes (job id)        | No (optional payload) | No*                            | Machine identity; must be non-spoofable and ops-bound             |
| OPT-PD02-03 | Job leg: yes        | No                    | No (clarifies dual use)        | Two entry surfaces to harden                                      |
| OPT-PD02-04 | Depends on registry | No                    | No                             | External SoT integrity / drift risk                               |
| OPT-PD02-C1 | No                  | No                    | No                             | Kind recoverable only via lease/payload correlation               |
| OPT-PD02-C2 | No                  | **Yes**               | No                             | Stronger per-event kind on audit records; broader platform change |

\*Any option that introduces **public HTTP** for B-04 / environment UPDATE would **violate** frozen anti-spoofing / no-public-env-PATCH constraints and is **out of bounds** unless a new Decision Freeze reopens those items. That path is **not** listed as a legitimate option here.

---

## 7. Governance Impact of Each Option

| Option      | Can be bound in Implementation Planning alone?                                                                                                                             | Needs new Decision Freeze / Security governance?                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| OPT-PD02-01 | **Only if** it stays within already-frozen kinds + non-public privileged entry, and PO accepts operator-subject provenance as the COND-D-03 ops mapping                    | **Yes**, if it changes runner/entry assumptions relative to “not HTTP / not auto-cron,” or invents a new privileged HTTP surface |
| OPT-PD02-02 | Can _document_ a candidate string in Impl Planning, but **ratifying a new canonical identity** is an explicit governance/ops decision — not silent invention during coding | **Yes** — establishing a new SYSTEM_JOB identity is beyond “mechanical planning”                                                 |
| OPT-PD02-03 | Binding dual modes is an explicit COND-D-03 ops-mapping decision                                                                                                           | **Likely yes** (or equivalent PO+Security ratification recorded as Freeze amendment / authorization precondition)                |
| OPT-PD02-04 | Impl Planning can _reference_ an external registry only after PO names it authoritative                                                                                    | **Yes** — external SoT must be explicitly authorized                                                                             |
| OPT-PD02-C1 | **Possibly** as audit-recording clarification under frozen Slice §13, if Security accepts                                                                                  | Escalate if Security rejects lease/payload-only kind recovery                                                                    |
| OPT-PD02-C2 | **No** as silent Impl Planning detail                                                                                                                                      | **Yes** — Security Audit contract change                                                                                         |

**Shared rule:** Closing P-D-02 requires an **explicit governance decision** that names the authoritative provenance. This analysis does not supply that decision.

---

## 8. Questions Requiring an Explicit Decision

1. **Kind for D’s authorized window:** OPERATOR only, SYSTEM_JOB only, or dual-mode?
2. **Exact `actorId` source rule** for the chosen kind(s) (subject field vs ops-bound job string vs registry key)?
3. **Trusted invocation boundary** for D (Nest internal entry shape under OQ-D-02, governed script, ops-triggered internal call) — and confirmation it is **not** public Connections HTTP?
4. **Is inventing/ratifying a new SYSTEM_JOB canonical identity acceptable**, and who owns the string + rotation/runbook?
5. **Must `actorKind` appear on Security Audit attribution**, or is lease `actorKind` + payload `actorId`/`systemJobId` sufficient for frozen audit substance?
6. **Correlation rule:** Must `correlationId` from the grant/actor be mandatory on all D durable events?
7. **Relationship to P-D-03:** Confirm NB-01 event-type choice remains independent, while sharing the same provenance `actorId` once P-D-02 is closed.

---

## 9. Proposed Next Governance Gate

```text
NEXT GATE (proposed):
  Explicit P-D-02 provenance decision / COND-D-03 ops-identity binding
  (PO + Security as required; Decision Freeze amendment or equivalent
   recorded authorization precondition)

OUT OF SCOPE FOR THAT GATE UNLESS EXPLICITLY INCLUDED:
  - Selecting NB-01 / P-D-03
  - Implementing D
  - Granting D Implementation Authorization
  - Implementing any option from §5
```

**Inputs to that gate:** this analysis + [`v3-l02-fiv-conn-04-d-pd02-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-disposition.md) + Decision Freeze COND-D-03 + Impl Planning COND-D-03 text.

**Outputs required to unblock P-D-02:** ratified answers to §8 questions 1–5 (minimum), naming the authoritative provenance tuple from §4.

---

## Final Status

```text
P-D-02 remains BLOCKED pending an explicit governance decision
establishing authoritative actor provenance.

Provenance resolution options identified: 4
  (OPT-PD02-01 … OPT-PD02-04)
Companion actorKind-recording options identified: 2
  (OPT-PD02-C1, OPT-PD02-C2)
Existing authoritative D actorId found: NO

NO OPTION SELECTED
NO OPTION RANKED
P-D-03 NOT TOUCHED
D IMPLEMENTATION NOT STARTED / NOT AUTHORIZED
P-D-02 DISPOSITION ARTIFACT UNTOUCHED
NO COMMIT/PUSH PERFORMED
```

**END OF FIV-CONN-04-D P-D-02 RESOLUTION ANALYSIS**
