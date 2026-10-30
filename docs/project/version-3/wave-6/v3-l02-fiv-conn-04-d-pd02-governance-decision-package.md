# P-D-02 Governance Decision Package

**Document:** FIV-CONN-04-D — P-D-02 Governance Decision Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Baseline:** `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd` (`HEAD` = `origin/main`)  
**Source artifacts (read-only; not modified):**

- [`v3-l02-fiv-conn-04-d-pd02-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-disposition.md)
- [`v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md`](./v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md)

**Nature:** Makes OPT-PD02-01…04 and C1/C2 concrete enough for an **explicit governance decision**. Does **not** select, rank, score, or prefer any option. Does **not** invent an `actorId`. Does **not** implement D. Does **not** modify production code, schemas, audit implementation, D planning docs, or prior P-D-02 artifacts. Does **not** dispose P-D-03. Does **not** commit or push.

```text
NO OPTION SELECTED
NO OPTION RANKED
P-D-02 REMAINS BLOCKED UNTIL EXPLICIT RATIFICATION
```

---

## 1. Decision Required

Governance must **explicitly ratify one authoritative actor provenance binding** for FIV-CONN-04-D so that:

1. A trusted D invocation boundary can construct a real `PrivilegedActorContext`.
2. The same concrete `actorId` (and optional `correlationId`) flows into B-04 and durable Security Audit attribution.
3. The identity is **not** invented solely to pass `isPrivilegedActorContext`.

**Currently blocked:** P-D-02 (COND-D-03 ops identity mapping).  
**Not decided by this package:** which OPT-PD02-* option wins; P-D-03 / NB-01; D Implementation Authorization; D code.

**Separate (non-provenance) decision:** how `actorKind` is recorded for investigation (C1 vs C2). That decision does **not** close P-D-02 by itself.

---

## 2. Frozen Requirement

| Element                       | Binding                                                                                                      | Controlling locations                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Kinds                         | `actorKind ∈ {SYSTEM_JOB, OPERATOR}`; `CLIENT` forbidden                                                     | Decision Freeze **COND-D-03**; Slice Approval COND-D-03; `migration-gate.ts` `PrivilegedActorContext`                             |
| Representation                | `{ actorId: string; actorKind: PrivilegedActorKind; correlationId?: string }`                                | Decision Freeze COND-D-03; Impl Planning COND-D-03; `migration-gate.ts`                                                           |
| B-04                          | D start/resume/heartbeat/release **must** use B-04 with privileged context; no client-controlled grant/fence | Decision Freeze COND-D-03; B-04 / `Conn04MigrationBoundaryService`                                                                |
| Anti-spoofing                 | No public HTTP for B-04; trusted invocation boundary constructs actor                                        | Decision Freeze COND-D-03; Impl Planning COND-D-03; Slice AC-D-07 / no public env PATCH                                           |
| Concrete `actorId` provenance | **UNRESOLVED / BLOCKING** — must be concrete and auditable; must **not** invent identity values              | Decision Freeze COND-D-03 (**UNRESOLVED** ops mapping); Impl Planning **P-D-02**; Impl Planning Review P-D-02; P-D-02 disposition |
| Audit substance               | Durable attributable events; Slice §13 payload may include `actorId` / `systemJobId`; no secrets             | Slice Planning Package §13; COND-D-02 substance (event **type** = P-D-03)                                                         |

**Paraphrase of COND-D-03 (Decision Freeze):** kind/contract ratified; exact operator/job identity provisioning for the D window remains unresolved and is a prerequisite for Implementation Planning / authorization.

**Paraphrase of P-D-02 (Impl Planning):** concrete privileged `actorId` provenance mapping for D invocation is **BLOCKING FOR AUTHORIZATION**.

---

## 3. Current Repository State

No authoritative D `actorId` exists today because:

| Observation                                                                         | Implication                                                                       |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `PrivilegedActorContext` + `isPrivilegedActorContext` exist                         | Shape only                                                                        |
| B-04 requires **caller-supplied** actor                                             | No identity factory / SoT in B-04                                                 |
| No production callers of `Conn04MigrationBoundaryService`                           | No live provenance path                                                           |
| No non-test construction of privileged actor literals                               | No established SYSTEM_JOB/OPERATOR id for CONN-04                                 |
| Security Audit stores `attribution.actorId` (string); no `actorKind` on attribution | Recording ≠ provenance                                                            |
| Lease row can store `actorKind`                                                     | Kind persistence for gate, not D actor SoT                                        |
| Connections HTTP uses `request.user.userId`                                         | Established for ordinary Connections only — **not** D privileged orchestrator SoT |
| `FIV_CONN_04_MIGRATION_BACKFILL`                                                    | Lease **purpose**, not actor                                                      |
| Test ids (`op-1`, `job-1`, …)                                                       | Non-authoritative                                                                 |

**Option set integrity:** The four provenance options and two companion options from the resolution analysis remain the option set. Repository evidence does **not** invalidate any of them; none are silently added or removed here.

**Classification note (Freeze vs resolution analysis):** Decision Freeze COND-D-03 defers **ops identity mapping** to Implementation Planning. Resolution analysis §7 often labeled new-identity / external-SoT paths as needing Freeze amendment. This package derives **A/B/C from Freeze + Slice text first**: filling COND-D-03 ops mapping within ratified kinds is **B** and typically **A** (no Freeze text change). **C** applies when an option changes a **frozen** contract (kinds, public B-04/HTTP ban, or Security Audit attribution schema). Explicit P-D-02 ratification remains mandatory in all cases (cannot invent silently).

---

## 4. Options

Governance classification codes (apply all that derive):

- **A** — NO FREEZE CHANGE REQUIRED
- **B** — IMPLEMENTATION-PLANNING DECISION REQUIRED
- **C** — DECISION-FREEZE AMENDMENT REQUIRED

---

### OPT-PD02-01 — OPERATOR via authenticated operator subject at a trusted non-public boundary

| #   | Field                                                 | Content                                                                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Exact mechanism**                                   | Trusted non-public D entry constructs `PrivilegedActorContext` with `actorKind: 'OPERATOR'` and `actorId` equal to the **authenticated operator subject id** already verified at that boundary; passes that context into B-04 and D Security Audit attribution                               |
| 2   | **Exact actorId provenance**                          | Authenticated Identity subject id (same class of id as ordinary Connections `request.user.userId`, but only when obtained at the **D trusted boundary**, not by treating public Connections HTTP as D)                                                                                       |
| 3   | **Where identity originates**                         | Authentication/Identity principal available at the privileged D invocation boundary (exact Nest/internal entry shape still bound under OQ-D-02 / Impl Planning)                                                                                                                              |
| 4   | **Identity already exists today?**                    | **Subject ids exist** in Identity. **D trusted boundary does not exist** as production code                                                                                                                                                                                                  |
| 5   | **New canonical identity required?**                  | **No** (reuses Identity subjects). New **invocation binding** for D is required                                                                                                                                                                                                              |
| 6   | **Production files/components (future, if ratified)** | New D orchestrator / trusted entry under `apps/api/src/modules/connections/` (or governed internal composition); `connections.module.ts` registration; D audit helper (after P-D-03); **not** `ConnectionsController` public env PATCH. B-04 / `migration-gate.ts` types typically unchanged |
| 7   | **Security Audit attribution changes?**               | **No schema change** — continue `attribution.actorId = subject id`                                                                                                                                                                                                                           |
| 8   | **PrivilegedActorContext changes?**                   | **No** type change; runtime values use `OPERATOR` + subject `actorId`                                                                                                                                                                                                                        |
| 9   | **B-04 changes?**                                     | **No** contract change; caller supplies valid privileged actor                                                                                                                                                                                                                               |
| 10  | **D frozen contract changes?**                        | **No** if stays `OPERATOR` + non-public entry + B-04 mandatory. **Would require Freeze reopen** if turned into public HTTP env mutation                                                                                                                                                      |
| 11  | **Security implications**                             | Attribution joins real subjects; integrity depends on boundary authenticity; client-supplied operator ids forbidden                                                                                                                                                                          |
| 12  | **Operational/audit implications**                    | Per-run human/service-account accountability; ops must ensure only authorized operators can reach the boundary                                                                                                                                                                               |
| 13  | **Migration/rollout implications**                    | No DB migration for identity; ops runbook for who may invoke D; no backfill of historical D audits (D not started)                                                                                                                                                                           |
| 14  | **Test implications**                                 | Tests must use realistic subject ids via trusted-entry fixtures; must deny unauthenticated / CLIENT construction; must not rely on public controller as D SoT                                                                                                                                |
| 15  | **Entirely inside D Impl Planning / Implementation?** | Wiring **yes after ratification**. Provenance rule itself needs **explicit P-D-02 ratification** before Implementation Authorization                                                                                                                                                         |
| 16  | **Decision Freeze amendment?**                        | **Not required** for kinds/anti-spoofing if in-bounds (**A**). Required (**C**) only if governance chooses a surface that conflicts with frozen no-public-B-04/HTTP                                                                                                                          |

**Governance classification:** **A + B** (in-bounds). **C** only on out-of-bounds public HTTP variant (not part of this option’s stated mechanism).

---

### OPT-PD02-02 — SYSTEM_JOB via newly ratified canonical job identity

| #   | Field                                                 | Content                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Exact mechanism**                                   | Governance + ops ratify a stable CONN-04 backfill job identity string; trusted internal D entry constructs `{ actorKind: 'SYSTEM_JOB', actorId: <ratified string>, correlationId? }` and passes it to B-04 + audits                                |
| 2   | **Exact actorId provenance**                          | The **ratified canonical job identity string** (value named only by governance/ops — **not invented in this package**)                                                                                                                             |
| 3   | **Where identity originates**                         | Ops/governance identity provision for CONN-04 migration backfill (runbook + change-controlled constant/registry after ratification)                                                                                                                |
| 4   | **Identity already exists today?**                    | **No** CONN-04-authoritative SYSTEM_JOB actor id found in repository                                                                                                                                                                               |
| 5   | **New canonical identity required?**                  | **Yes**                                                                                                                                                                                                                                            |
| 6   | **Production files/components (future, if ratified)** | Constant or config binding for ratified string; D trusted entry / orchestrator; module registration; D audit helper (P-D-03); optional Slice payload `systemJobId` mirroring `actorId`. Types in `migration-gate.ts` typically unchanged           |
| 7   | **Security Audit attribution changes?**               | **No schema change** — `attribution.actorId` holds job string; payload may also carry `systemJobId` per Slice §13                                                                                                                                  |
| 8   | **PrivilegedActorContext changes?**                   | **No** type change; runtime `SYSTEM_JOB` + ratified `actorId`                                                                                                                                                                                      |
| 9   | **B-04 changes?**                                     | **No** contract change                                                                                                                                                                                                                             |
| 10  | **D frozen contract changes?**                        | **No** to kind enum. Auto-cron authorization is **out of scope** of current frozen “not automatically authorized cron” proposal unless separately decided                                                                                          |
| 11  | **Security implications**                             | Machine identity must be non-client-settable; inventing without ratification recreates P-D-02 violation; rotation/compromise procedures needed                                                                                                     |
| 12  | **Operational/audit implications**                    | Stable cross-run identity; weaker per-human attribution unless ops logs / `correlationId` compensate                                                                                                                                               |
| 13  | **Migration/rollout implications**                    | No schema migration for string itself; ops must provision before first D run; document string ownership                                                                                                                                            |
| 14  | **Test implications**                                 | Fixtures must use the **ratified** string (or test double clearly marked non-prod); deny empty/CLIENT; assert audit `actorId` equals bound job id                                                                                                  |
| 15  | **Entirely inside D Impl Planning / Implementation?** | **No** for inventing the string. **Yes** for wiring **after** explicit identity ratification                                                                                                                                                       |
| 16  | **Decision Freeze amendment?**                        | Kind contract: **A**. Naming the job id: Freeze COND-D-03 left naming unresolved for Impl Planning → primary path is **B** + explicit P-D-02 ratification artifact. **C** only if PO elects to embed the named identity into COND-D-03 Freeze text |

**Governance classification:** **A + B**. Optional **C** if PO embeds the named identity into Decision Freeze COND-D-03.

---

### OPT-PD02-03 — Dual-mode provenance (OPERATOR and SYSTEM_JOB, each bound)

| #   | Field                                                 | Content                                                                                                                                                                                              |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Exact mechanism**                                   | D supports two trusted entry modes: (i) OPERATOR path as in OPT-PD02-01; (ii) SYSTEM_JOB path as in OPT-PD02-02; each mode constructs its own `PrivilegedActorContext`; shared B-04 + audit plumbing |
| 2   | **Exact actorId provenance**                          | **Mode-dependent:** authenticated subject id **or** ratified SYSTEM_JOB string — never mixed within a single ambiguous entry                                                                         |
| 3   | **Where identity originates**                         | Same sources as OPT-PD02-01 and OPT-PD02-02 respectively                                                                                                                                             |
| 4   | **Identity already exists today?**                    | Subjects: yes. CONN-04 SYSTEM_JOB string: **no**. Dual D entry: **no**                                                                                                                               |
| 5   | **New canonical identity required?**                  | **SYSTEM_JOB leg: yes.** OPERATOR leg: **no**                                                                                                                                                        |
| 6   | **Production files/components (future, if ratified)** | Two constructors / entry façades (or one entry with explicit mode discriminant); D orchestrator; module wiring; tests for both modes; shared audit helper                                            |
| 7   | **Security Audit attribution changes?**               | **No schema change** required; both modes set `attribution.actorId`                                                                                                                                  |
| 8   | **PrivilegedActorContext changes?**                   | **No** type change; both allowed kinds already frozen                                                                                                                                                |
| 9   | **B-04 changes?**                                     | **No** contract change                                                                                                                                                                               |
| 10  | **D frozen contract changes?**                        | **No** — kinds already allow both. Clarifies previously unbound COND-D-03 ops mapping                                                                                                                |
| 11  | **Security implications**                             | Two entry surfaces to harden; mode confusion risk; each path needs anti-spoofing                                                                                                                     |
| 12  | **Operational/audit implications**                    | Must make mode discoverable (lease `actorKind` and/or payload); runbooks for both paths                                                                                                              |
| 13  | **Migration/rollout implications**                    | SYSTEM_JOB leg needs identity provision; OPERATOR leg needs access control; no historical D data                                                                                                     |
| 14  | **Test implications**                                 | Matrix: both modes acquire/audit; cross-mode denial; reclaim rules if OPERATOR-only reclaim remains                                                                                                  |
| 15  | **Entirely inside D Impl Planning / Implementation?** | Wiring after dual-mode **and** SYSTEM_JOB identity ratification; not silent                                                                                                                          |
| 16  | **Decision Freeze amendment?**                        | Kinds: **A**. Dual-mode ops mapping: **B** (COND-D-03 deferred ops binding). **C** if Freeze text is amended to mandate dual-mode rather than leave single-mode possible                             |

**Governance classification:** **A + B**. Optional **C** if Freeze is amended to _require_ dual-mode.

---

### OPT-PD02-04 — External ops identity registry / runbook as provenance SoT

| #   | Field                                                 | Content                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Exact mechanism**                                   | Governance ratifies that the authoritative D actor identity (OPERATOR subject list and/or SYSTEM_JOB string) is defined in an **external ops registry/runbook**; runtime D entry reads only the bound value(s) into `PrivilegedActorContext` |
| 2   | **Exact actorId provenance**                          | Value(s) published in the ratified registry/runbook entry for FIV-CONN-04-D (exact key/name named by governance — not invented here)                                                                                                         |
| 3   | **Where identity originates**                         | External ops SoT; code is a consumer, not the inventing authority                                                                                                                                                                            |
| 4   | **Identity already exists today?**                    | **Unknown / not in repository.** No in-repo CONN-04 actor SoT found                                                                                                                                                                          |
| 5   | **New canonical identity required?**                  | **Possibly** (if registry creates a new job id). **Possibly not** (if it only lists existing operator subjects)                                                                                                                              |
| 6   | **Production files/components (future, if ratified)** | Config/env/registry client or documented constant synced from registry; D trusted entry; module wiring; ops change-control docs. Avoid hard-coding unratified literals                                                                       |
| 7   | **Security Audit attribution changes?**               | **No** by itself                                                                                                                                                                                                                             |
| 8   | **PrivilegedActorContext changes?**                   | **No** type change                                                                                                                                                                                                                           |
| 9   | **B-04 changes?**                                     | **No** contract change                                                                                                                                                                                                                       |
| 10  | **D frozen contract changes?**                        | **No** if kinds unchanged; fulfills COND-D-03 “runbook binding” gap                                                                                                                                                                          |
| 11  | **Security implications**                             | Registry compromise/drift is security-critical; need change control and drift detection                                                                                                                                                      |
| 12  | **Operational/audit implications**                    | Ops owns SoT; engineering must not diverge; audits only as trustworthy as registry hygiene                                                                                                                                                   |
| 13  | **Migration/rollout implications**                    | Provision registry before first D run; define sync cadence; no DB actor migration inherently                                                                                                                                                 |
| 14  | **Test implications**                                 | Inject registry double; fail closed if unbound/missing; assert runtime actor matches bound value                                                                                                                                             |
| 15  | **Entirely inside D Impl Planning / Implementation?** | **No** for authorizing external SoT. **Yes** for consumption wiring after ratification                                                                                                                                                       |
| 16  | **Decision Freeze amendment?**                        | Freeze already contemplated runbook binding as UNRESOLVED → primary **B** + **A**. **C** if Freeze is amended to name a specific external registry as mandatory SoT                                                                          |

**Governance classification:** **A + B**. Optional **C** if a specific external registry is written into Decision Freeze.

---

## 5. ActorKind Companion Decisions

**These are separate from actor provenance.** Neither C1 nor C2 supplies an authoritative `actorId`. P-D-02 remains blocked until a provenance option (OPT-PD02-01…04) is ratified, regardless of C1/C2.

### C1 — Lease + Slice payload for kind; attribution remains `actorId`-only

| Topic                                                 | Content                                                                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What it changes**                                   | **Interpretation / recording practice:** rely on migration-gate lease `actorKind` and/or D durable event **payload** fields (`actorId` / `systemJobId` per Slice §13). No Security Audit attribution schema change |
| **Necessary to close P-D-02?**                        | **No**                                                                                                                                                                                                             |
| **Compatible with existing Security Audit contract?** | **Yes** — attribution already `actorId`-only; matches `connection.migration-gate` pattern                                                                                                                          |
| **Changes frozen D audit requirement?**               | **No** if treated as using already-allowed Slice §13 payload fields + existing lease persistence. Clarifies investigation procedure                                                                                |
| **Governance classification**                         | **A + B** (clarification in Impl Planning / Security acceptance). Escalate to **C** only if Security rejects payload/lease-only kind recovery as insufficient for COND-D-02 substance                              |

### C2 — Extend Security Audit attribution to persist `actorKind`

| Topic                                                 | Content                                                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it changes**                                   | Security Audit attribution type, normalization/rules, likely persistence/mapper, platform docs — add `actorKind` (or equivalent)                  |
| **Necessary to close P-D-02?**                        | **No**                                                                                                                                            |
| **Compatible with existing Security Audit contract?** | **Requires contract extension** — not present today (`security-audit-record.ts` has no `actorKind`)                                               |
| **Changes frozen D audit requirement?**               | Does **not** change Slice §13 kind-of-substance (attributable actor). **Adds** a platform recording requirement beyond current gate-audit pattern |
| **Governance classification**                         | **C** (Security Audit / Decision Freeze–level contract change) + **B** for D helper wiring after platform change                                  |

---

## 6. Contract Impact Matrix

| Concern                              | OPT-PD02-01                                  | OPT-PD02-02                                      | OPT-PD02-03                                           | OPT-PD02-04                                       | C1                               | C2                  |
| ------------------------------------ | -------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------- | -------------------------------- | ------------------- |
| **actorId provenance**               | Authenticated operator subject at D boundary | New ratified SYSTEM_JOB string                   | Both (mode-dependent)                                 | Registry/runbook-bound value(s)                   | N/A (not provenance)             | N/A                 |
| **actorKind used**                   | `OPERATOR`                                   | `SYSTEM_JOB`                                     | Both                                                  | Per registry binding                              | Recording only                   | Recording only      |
| **PrivilegedActorContext type**      | Unchanged                                    | Unchanged                                        | Unchanged                                             | Unchanged                                         | Unchanged                        | Unchanged           |
| **B-04 contract**                    | Unchanged (caller supplies)                  | Unchanged                                        | Unchanged                                             | Unchanged                                         | N/A                              | N/A                 |
| **Security Audit schema**            | Unchanged                                    | Unchanged                                        | Unchanged                                             | Unchanged                                         | Unchanged                        | **Changed**         |
| **D frozen kinds / anti-spoofing**   | Unchanged if non-public                      | Unchanged if non-public                          | Unchanged                                             | Unchanged                                         | Unchanged                        | Unchanged           |
| **Decision Freeze impact**           | **A** (in-bounds); **C** if public HTTP      | **A**; optional **C** if name embedded in Freeze | **A**; optional **C** if dual-mode mandated in Freeze | **A**; optional **C** if registry named in Freeze | **A**; **C** if Security rejects | **C**               |
| **Implementation Planning impact**   | **B**                                        | **B**                                            | **B**                                                 | **B**                                             | **B**                            | **B** (after **C**) |
| **New canonical identity**           | No                                           | **Yes**                                          | Yes (SYSTEM_JOB leg)                                  | Possibly                                          | No                               | No                  |
| **Closes P-D-02 if ratified alone?** | Yes (provenance)                             | Yes                                              | Yes                                                   | Yes                                               | **No**                           | **No**              |

---

## 7. Decision Questions

Governance authority answers (record answers in a ratification artifact):

### Provenance (required to close P-D-02)

**Q1.** Select **exactly one** provenance option:  
`OPT-PD02-01` / `OPT-PD02-02` / `OPT-PD02-03` / `OPT-PD02-04`?

**Q2.** Confirm the trusted D invocation boundary is **not** public Connections HTTP / public B-04?  
`YES` / `NO` (NO requires Freeze reopen — out of current option set)

**Q3.** If Q1 = `OPT-PD02-01` or dual-mode OPERATOR leg: is `actorId` defined as the authenticated Identity subject id at that boundary?  
`YES` / `NO` — if NO, state alternate subject field

**Q4.** If Q1 = `OPT-PD02-02` or dual-mode SYSTEM_JOB leg or registry job id: does governance authorize introduction of a **new** canonical SYSTEM_JOB identity?  
`YES` / `NO`

**Q5.** If Q4 = YES: record the **exact ratified identity string** (or registry key that resolves to it) and owning ops role.  
(Answer is a concrete value/key — this package does not invent it)

**Q6.** If Q1 = `OPT-PD02-04`: name the authoritative external registry/runbook and the exact binding key(s).  
(Value not invented here)

**Q7.** Must `correlationId` from the grant/actor be mandatory on all D durable Security Audit events?  
`YES` / `NO`

### ActorKind recording (separate; does not close P-D-02)

**Q8.** Select actorKind recording: `C1` / `C2` / `DEFER`?

**Q9.** If Q8 = `C1`: does Security accept lease `actorKind` + Slice payload as sufficient for investigation without attribution-schema change?  
`YES` / `NO`

### Scope fences

**Q10.** Confirm P-D-03 / NB-01 remains a **separate** decision?  
`YES` / `NO`

**Q11.** Confirm this ratification does **not** grant D Implementation Authorization by itself?  
`YES` / `NO`

---

## 8. Post-Decision Consequences

### After one of OPT-PD02-01…04 is explicitly ratified

| Becomes unblocked                                                                   | Still blocked / separate                                       |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| P-D-02 provenance prerequisite (can be marked SATISFIED in a follow-on disposition) | P-D-03 / NB-01                                                 |
| Ability to write D Impl Planning entry/actor sections without inventing identity    | D Implementation Authorization (needs remaining prerequisites) |
| Ability to design trusted entry + tests against a named rule                        | D production implementation                                    |

### Additional artifacts typically required after ratification

1. **P-D-02 ratification / satisfaction disposition** recording Q1–Q7 answers (and exact identity string/key if applicable).
2. **Optional Decision Freeze amendment** only if Q answers trigger **C**.
3. **Impl Planning update** (when authorized to edit planning) binding the ratified provenance into entry design — **not** performed by this package.
4. **C1/C2 decision record** (may be simultaneous or later; does not substitute for provenance).
5. **Ops runbook / registry update** if OPT-PD02-02/03/04.

### Explicit non-consequences

```text
Ratifying P-D-02 provenance does NOT:
  - start D implementation
  - grant D Implementation Authorization
  - dispose P-D-03
  - modify Security Audit schema (unless C2 is also ratified)
```

---

## 9. Governance Gate

```text
P-D-02 cannot be marked SATISFIED until one authoritative actor
provenance option (OPT-PD02-01 | OPT-PD02-02 | OPT-PD02-03 | OPT-PD02-04)
is explicitly ratified.

C1 / C2 are companion recording decisions only.
They do not independently satisfy P-D-02.

P-D-03 remains separate and untouched.

D implementation remains NOT STARTED / NOT AUTHORIZED.
```

**Next gate:** Explicit P-D-02 provenance ratification (answers to §7 Q1–Q7 at minimum), producing a satisfaction/disposition artifact.  
**This package:** decision-ready options only — **no selection**.

```text
FOUR PROVENANCE OPTIONS CONFIRMED: OPT-PD02-01 … OPT-PD02-04
TWO COMPANION OPTIONS CONFIRMED: C1, C2
AUTHORITATIVE D actorId FOUND: NO
OPTION SELECTED: NO
PRIOR P-D-02 ARTIFACTS: UNTOUCHED
NO COMMIT / NO PUSH
```

**END OF P-D-02 GOVERNANCE DECISION PACKAGE**
