# FIV-CONN-04-D P-D-02 — SYSTEM_JOB Identity Authority Discovery

**Document:** FIV-CONN-04-D — Identify Authority for Canonical SYSTEM_JOB Identity Provisioning  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Related:** P-D-02 **BLOCKED** under ratified model **OPT-PD02-02**  
**Baseline:** `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd` (`HEAD` = `origin/main`)

**Nature:** **DISCOVERY ONLY.** Determines whether existing project governance / operational documentation already names who may provision or ratify canonical `SYSTEM_JOB` identities. Does **not** invent an `actorId`. Does **not** create an identity. Does **not** create a new register. Does **not** modify production code, D implementation, P-D-03, schemas, or prior P-D-02 artifacts. Does **not** commit or push.

**Inputs inspected (read-only):** governance / Wave 6 PO artifacts; D Decision Freeze COND-D-03; P-D-02 disposition / resolution-analysis / governance-decision-package / ratification / identity-provisioning-spec; Architecture / Implementation / ADR / Security / Identity / Auth docs; RACI / ownership / technical-debt; runbook search; domain-local actor string evidence.

```text
NO DOCUMENTED AUTHORITY EXISTS FOR PROVISIONING CANONICAL SYSTEM_JOB IDENTITIES.
P-D-02 remains BLOCKED.
Missing item = governance/process decision (not engineering implementation).
```

---

## 1. Existing Documented Authority

| Question                                                                                       | Finding            |
| ---------------------------------------------------------------------------------------------- | ------------------ |
| Which role/person/team has authority to provision or ratify canonical `SYSTEM_JOB` identities? | **NOT DOCUMENTED** |
| Exact role/team named as SoT for privileged job `actorId` strings?                             | **None found**     |

### What exists (not authority for SYSTEM_JOB provisioning)

| Artifact                                      | What it establishes                                                                                                      | Why it is not SYSTEM_JOB provisioning authority                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Decision Freeze **COND-D-03**                 | Kind/contract `SYSTEM_JOB` \| `OPERATOR` **RATIFIED**; ops identity mapping **UNRESOLVED**                               | Explicitly does **not** freeze a named human/role or job ID                                |
| P-D-02 ratification                           | Model **OPT-PD02-02** selected; Q4 authorizes new identity **in principle**; Q5 exact string + owner **NOT ESTABLISHED** | Selects model; does **not** name who may mint the string                                   |
| P-D-02 identity-provisioning-spec             | Contract fields required for satisfaction; paths P1–P4                                                                   | Requirements / candidate delivery vehicles — **not** a pre-existing authority RACI         |
| P-D-02 resolution-analysis §9                 | **Proposes** next gate “PO + Security”                                                                                   | Proposal language only; **not** an established binding RACI for identity minting           |
| D-GOV-04                                      | ADR creation/approval authority for live-capital ADR                                                                     | Unrelated to `SYSTEM_JOB` / `PrivilegedActorContext` identity provisioning                 |
| RC-17 lightweight RACI                        | Epic stage Responsible/Accountable roles                                                                                 | Stages 0–6 process ownership — **not** machine/job identity provisioning                   |
| Product Owner Guide                           | PO / Chief Architect product-truth / gate decisions                                                                      | Does **not** define SYSTEM_JOB / service-job identity minting authority                    |
| Security ownership language (package reviews) | “No new security ownership”; consume Auth/Authz/Vault/Audit                                                              | Preserves existing security **module** ownership — **not** a job-identity provisioner role |

**Anti-inference rule applied:** Connections / migration-gate / Security Audit code ownership is **not** treated as authority to provision canonical `SYSTEM_JOB` identities.

---

## 2. Existing Identity-Provisioning Process

| Question                                                           | Finding                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Documented process for creating system / service / job identities? | **NOT FOUND**                                              |
| Checked-in runbook for CONN-04 / privileged job actor binding?     | **NOT FOUND** (`*runbook*` search: **0** files)            |
| COND-D-03 ops binding procedure?                                   | Explicitly **UNRESOLVED** (“credentials, runbook binding”) |

Informal phrases in P-D-02 artifacts (“governance/ops ratify”, “ops-provisioned job identity”, “runbook + change-controlled constant/registry”) describe **needed** future actions. They do **not** cite an existing documented process with steps, owners, and approval gates.

---

## 3. Existing Owner Convention

| Question                                                                        | Finding       |
| ------------------------------------------------------------------------------- | ------------- |
| Owner convention for privileged / `SYSTEM_JOB` / service-account actor strings? | **NOT FOUND** |
| Naming convention for `PrivilegedActorContext` `actorId` values?                | **NOT FOUND** |

### Domain-local strings observed (non-authoritative for CONN-04 / PrivilegedActorContext)

| Example                            | Notes                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `system:startup-recovery`          | Domain-local recovery actor — **not** `PrivilegedActorContext`, **not** CONN-04 |
| `execution-engine`                 | Domain event actor string — **not** CONN-04 SYSTEM_JOB provenance               |
| Test fixtures (`job-1`, `op-1`, …) | Non-authoritative                                                               |

These show ad-hoc fixed strings in some domains. They do **not** establish a repository-wide owner, naming, rotation, or change-control convention for canonical `SYSTEM_JOB` identities.

---

## 4. Existing Authoritative Registry / External Source

| Question                                                                                                | Finding                                                           |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| In-repo identity registry for privileged job actors?                                                    | **NOT FOUND**                                                     |
| External ops registry / runbook explicitly referenced by project docs as SoT for SYSTEM_JOB identities? | **NOT FOUND**                                                     |
| Ratification Q6 (external registry)                                                                     | **NOT REQUIRED** unless later provisioned through such a registry |

OPT-PD02-04 describes a **hypothetical** external ops registry/runbook provenance path. No project document inspected names an existing external system URL, registry key, or ops SoT that already holds CONN-04 / platform `SYSTEM_JOB` identities.

---

## 5. Exact Role/Team Responsible (If Explicitly Documented)

```text
EXPLICITLY DOCUMENTED ROLE/TEAM FOR SYSTEM_JOB IDENTITY PROVISIONING: NONE
```

Closest non-binding language (do **not** treat as authority):

| Source                           | Language                                        | Status                                                                   |
| -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| Resolution-analysis §9           | Proposed gate: “PO + Security”                  | **Proposed**, not ratified as identity-minting RACI                      |
| Ratification / provisioning-spec | “Governance/ops must provision…”                | **Obligation statement** without naming a concrete accountable role/team |
| Impl Planning (non-binding)      | “stable job identity string provisioned by ops” | **Unbound**; no ops team named                                           |

---

## 6. Evidence / Source Locations

| Path                                                                                                                  | Relevance                                                                    |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-decision-freeze.md` (COND-D-03)                                   | Contract ratified; ops identity mapping **UNRESOLVED**; no named role/job ID |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-pd02-disposition.md`                                              | No authoritative `actorId`; B-04 does not provision identity                 |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md`                                      | Asks who owns string + runbook; proposes PO+Security gate (non-binding)      |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-pd02-governance-decision-package.md`                              | OPT-PD02-02 requires governance/ops ratification of string — no existing SoT |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-pd02-ratification.md`                                             | OPT-PD02-02 selected; Q5 not established                                     |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-pd02-identity-provisioning-spec.md`                               | No naming/owner/registry/runbook convention found                            |
| `docs/project/rc-17-development-process.md` (RACI)                                                                    | Epic-stage RACI only                                                         |
| `docs/project/version-3/wave-6/d-gov-04-adr-authority-decision-brief.md`                                              | ADR authority — not SYSTEM_JOB identity                                      |
| `docs/project/version-3/product-owner-onboarding/06-product-owner-guide.md`                                           | No SYSTEM_JOB provisioning authority                                         |
| `docs/Implementation/009-Authentication-and-Authorization.md`                                                         | No SYSTEM_JOB / job-identity provisioning                                    |
| `docs/project/version-3/v3-security-vision.md` / `security-platform-overview.md` / `security-event-classification.md` | No SYSTEM_JOB provisioning process                                           |
| `docs/project/v2-authority-matrix.md`                                                                                 | Domain SoT matrix — not job-actor minting                                    |
| `docs/project/technical-debt.md`                                                                                      | No SYSTEM_JOB identity governance process                                    |
| `docs/adr/` (sampled via search)                                                                                      | No SYSTEM_JOB identity provisioning ADR                                      |
| Repository runbook search                                                                                             | **Zero** `*runbook*.md` files                                                |

---

## 7. Which Governance Artifact Should Formally Record the Resulting Identity?

| Question                                                                                 | Finding  |
| ---------------------------------------------------------------------------------------- | -------- |
| Existing **mandatory** artifact designated as SoT for provisioned SYSTEM_JOB identities? | **NONE** |

Candidate recording vehicles appear only as **unordered proposed paths** in the P-D-02 identity-provisioning-spec (P1 satisfaction disposition; P2 Decision Freeze COND-D-03 amendment; P3 ops runbook/registry + governance record; P4 governance-bound config key after value ratification). **None is established as the required recording artifact by prior governance.** Selecting which artifact formally records the identity is part of the missing governance/process decision.

---

## 8. Who Must Provide Exact `actorId` and Owner Before P-D-02 = SATISFIED?

Because **no documented authority** exists:

```text
WHO MUST PROVIDE THE EXACT actorId + OWNER: NOT DEFINED BY EXISTING DOCUMENTATION.
```

P-D-02 satisfaction still requires (per ratification Q5 / provisioning-spec §3 / §6), once an authority/process is decided:

- exact canonical SYSTEM_JOB `actorId`
- owner
- authoritative provenance/source
- non-client-control confirmation
- trusted-boundary binding mechanism

Those inputs cannot be assigned to a concrete documented role/team today. Assigning that responsibility is itself a **governance/process decision**, not an engineering task.

---

## Final Conclusion

```text
NO DOCUMENTED AUTHORITY EXISTS FOR PROVISIONING CANONICAL SYSTEM_JOB IDENTITIES.
```

| Item                                                 | Status                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Documented provisioning authority                    | **NONE**                                                                                                              |
| Documented provisioning process                      | **NONE**                                                                                                              |
| Documented owner / naming convention                 | **NONE**                                                                                                              |
| Documented in-repo or external identity registry SoT | **NONE**                                                                                                              |
| Mandatory recording artifact already designated      | **NONE**                                                                                                              |
| P-D-02 under OPT-PD02-02                             | Remains **BLOCKED**                                                                                                   |
| Missing item                                         | **Governance/process decision** (define authority + process + recording artifact), **not** engineering implementation |
| D implementation / P-D-03 / production code          | Untouched by this discovery                                                                                           |

```text
STOP.
No production changes.
No P-D-03.
No D implementation.
No staging.
No commit.
No push.
```

**END OF P-D-02 IDENTITY AUTHORITY DISCOVERY**
