# P-D-02 Governance Escalation

**Document:** FIV-CONN-04-D — Escalate P-D-02 Governance/Process Gap  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Baseline:** `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd` (`HEAD` = `origin/main`)

**Discovery input (read-only):**  
[`v3-l02-fiv-conn-04-d-pd02-identity-authority-discovery.md`](./v3-l02-fiv-conn-04-d-pd02-identity-authority-discovery.md)

**Nature:** Formal **governance escalation** only. Does **not** invent an `actorId` or owner. Does **not** assign authority to PO, Security, Operations, Engineering, or any other role. Does **not** create a SYSTEM_JOB identity or registry. Does **not** implement D. Does **not** modify P-D-03, production code, Security Audit, B-04, `migration-gate.ts`, or existing P-D-02 artifacts. Does **not** stage, commit, or push.

```text
P-D-01 = DELIVERED
P-D-02 = BLOCKED BY A GOVERNANCE/PROCESS GAP
PROVENANCE MODEL = OPT-PD02-02 (not reopened)
```

---

## 1. Blocker

P-D-02 is BLOCKED because the project has not established an authoritative process or authority for provisioning canonical SYSTEM_JOB identities.

Established discovery facts:

- No documented authority exists for provisioning or ratifying canonical SYSTEM_JOB identities.
- No documented provisioning process exists.
- No owner/naming convention exists.
- No in-repo or external identity registry is documented as an authoritative SoT.
- No mandatory artifact for recording such identity is designated.
- Project documentation does not define who must supply the exact `actorId` + owner.
- Informal references to “governance/ops” or “PO + Security” are **not** an established RACI.

---

## 2. Already Ratified

| Item                                 | Status                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Provenance model                     | **OPT-PD02-02** — SYSTEM_JOB via newly ratified canonical job identity |
| Model selection                      | **Not reopened** by this escalation                                    |
| Exact canonical SYSTEM_JOB `actorId` | **Not provisioned**                                                    |
| Q5 (exact string + owner)            | **Not established**                                                    |

This escalation addresses the **governance/process gap that prevents satisfaction** of P-D-02 under the already-selected model. It does **not** reopen OPT-PD02-01 / OPT-PD02-03 / OPT-PD02-04 selection.

---

## 3. Missing Governance Decisions

The following decisions are **required** and are **not answered** by this artifact. Do **not** invent answers here.

### G1 — Authority

Which role/team/person is authorized to provision and/or ratify canonical SYSTEM_JOB identities?

### G2 — Provisioning Process

What controlled process creates or approves the identity?

### G3 — Authoritative Source of Truth

Where is the canonical identity recorded and maintained?

### G4 — Naming

What naming convention applies to SYSTEM_JOB identities?

### G5 — Ownership

Who is accountable for lifecycle, rotation/change, and operational use of the identity?

### G6 — Trusted Binding

How does the trusted D invocation boundary obtain the canonical `actorId` without allowing client control?

### G7 — Governance Record

Which project/governance artifact becomes the authoritative record of the identity?

---

## 4. Required P-D-02 Satisfaction Evidence

P-D-02 may move from **BLOCKED** to **SATISFIED** only when **all** of the following evidence exists in an explicit governance record (values must come from resolved G1–G7 — **not** invention):

| #   | Required evidence                                                                           |
| --- | ------------------------------------------------------------------------------------------- |
| 1   | Explicit **authority** (resolved G1)                                                        |
| 2   | Explicit **provisioning process** (resolved G2)                                             |
| 3   | Exact canonical **`actorId`** (character-for-character)                                     |
| 4   | Accountable **owner** (resolved G5)                                                         |
| 5   | Authoritative **provenance/source** (resolved G3)                                           |
| 6   | **Non-client-control** confirmation                                                         |
| 7   | Trusted-boundary **binding mechanism** (resolved G6)                                        |
| 8   | **Governance record/reference** naming the artifact that records the identity (resolved G7) |

Until that evidence exists, P-D-02 remains **BLOCKED**.

---

## 5. Dependency Classification

| Classification       | Value                                      |
| -------------------- | ------------------------------------------ |
| Blocker class        | **GOVERNANCE / PROCESS BLOCKER**           |
| Engineering relation | **EXTERNAL TO ENGINEERING IMPLEMENTATION** |

This is **not** classified as ordinary technical implementation debt. No existing governance convention inspected for this escalation authorizes treating the missing SYSTEM_JOB authority/process as ordinary engineering TD.

---

## 6. Impact

- P-D-02 blocks **D Implementation Authorization**.
- **D implementation must not start**.
- **P-D-03** remains separate and **untouched**.
- **No production change** is authorized by this escalation.
- **No `actorId` may be invented** to unblock engineering.

---

## 7. Resolution Owner

Resolution owner is UNDEFINED because the repository contains no authoritative RACI for SYSTEM_JOB identity provisioning.

The governance process must first establish the responsible authority.

---

## 8. Next Governance Gate

```text
NEXT GOVERNANCE GATE:
ESTABLISH SYSTEM_JOB IDENTITY GOVERNANCE AUTHORITY AND PROVISIONING PROCESS.
```

Only after that gate is resolved may the project:

1. provision the canonical identity,
2. record its owner/provenance,
3. satisfy P-D-02,
4. update D Implementation Planning,
5. proceed toward D Implementation Authorization.

P-D-03 remains independent and must not be used to bypass P-D-02.

---

## Final Status

```text
P-D-02 = BLOCKED
BLOCKER CLASS:
GOVERNANCE / PROCESS GAP
CANONICAL SYSTEM_JOB ACTOR:
NOT PROVISIONED
AUTHORITY:
NOT DEFINED
PROVISIONING PROCESS:
NOT DEFINED
AUTHORITATIVE SOT:
NOT DEFINED
D IMPLEMENTATION:
NOT STARTED / NOT AUTHORIZED
P-D-03:
UNTOUCHED
```

**END OF P-D-02 GOVERNANCE ESCALATION**
