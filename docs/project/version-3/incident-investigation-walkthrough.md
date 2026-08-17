# Incident Investigation Walkthrough

**Document:** Version 3 Incident Investigation Walkthrough
**Date:** 2026-08-17
**Status:** Product Owner investigation scenario for V3-S05 — Approved with the S05 Planning Package. Planning only.
**Package:** V3-S05 Audit Trail Foundation (Security Audit Product)
**Nature:** Operator scenario. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision. Not a test script with file paths.

**Companions:** [`security-audit-overview.md`](./security-audit-overview.md) · [`security-event-classification.md`](./security-event-classification.md) · [`v3-s05-product-scope.md`](./v3-s05-product-scope.md) · [`v3-s05-validation-plan.md`](./v3-s05-validation-plan.md)

This walkthrough checks whether the Security Audit Product is **fit for investigations**, not only for accumulating events.

It is written in operator language. One scenario. One honest gap list for later waves.

---

## Scenario

**Suspicion:** An Administrator believes someone gained unauthorized access to an account.

Typical trigger (any one is enough):

- The person says “I didn’t sign in from that place / at that time”
- An unexpected role change appeared
- A vault secret was created or revoked without a known reason
- Sessions show a device the person does not recognize

The Administrator opens **Security Audit / Security History** and investigates in the product — not over SSH.

---

## Investigation path

```text
Administrator opens Security Audit
        ↓
Filter to the affected person and a recent time range
        ↓
Read Session and Authentication events in order
        ↓
Check Recovery (password / recovery outcomes)
        ↓
Check Privilege and Authorization (did power change?)
        ↓
Check Vault (were credentials created or revoked?)
        ↓
Check Abuse / Security Platform (was there spray or throttling?)
        ↓
Form a conclusion from the sequence — or name what is still unknown
```

---

## What the operator should see (in sequence)

Order below is the **investigation reading order**, not a claim that every incident includes every class.

### 1. Session — “Is there a foreign device?”

| What appears                                       | What it means                                       |
| -------------------------------------------------- | --------------------------------------------------- |
| Session started for the account                    | A sign-in presence began                            |
| Later logout / revoke / revoke others / revoke all | Someone cleaned up — or the real owner responded    |
| Missing expected logout before a new session       | Possible parallel use; needs Authentication context |

**Operator understanding:** Which sessions existed, when they started, and whether they were ended.

### 2. Authentication — “Was sign-in forced or normal?”

| What appears                   | What it means                        |
| ------------------------------ | ------------------------------------ |
| Sign-in succeeded              | Identity was accepted at that time   |
| Sign-in failed (possibly many) | Guessing or spray before success     |
| Lockout / locked               | Abuse or forgotten password pressure |

**Operator understanding:** Whether access looked like a normal sign-in or an attack path into the account.

### 3. Recovery — “Did someone take over via password reset?”

| What appears         | What it means                                       |
| -------------------- | --------------------------------------------------- |
| Password changed     | Credential was replaced (actor when known)          |
| Recovery completed   | Recovery path was used                              |
| Recovery unavailable | Host mail off — honest non-event for email recovery |

**Operator understanding:** Whether the password story matches what the person claims.

### 4. Privilege — “Did unauthorized access become lasting power?”

| What appears                                         | What it means               |
| ---------------------------------------------------- | --------------------------- |
| Role changed (especially to Trader or Administrator) | Lasting escalation          |
| Role change refused                                  | Attempted escalation failed |
| Own-role deny / last-Admin protection                | Guardrails held             |

**Operator understanding:** Whether the incident stayed at “signed in” or became “can administer / can later trade.”

### 5. Authorization — “What did they try after getting in?”

| What appears                                                  | What it means                     |
| ------------------------------------------------------------- | --------------------------------- |
| Privileged action denied                                      | Reconnaissance or blocked misuse  |
| Allowed privileged admin actions already covered as Privilege | Power was used, not only obtained |

**Operator understanding:** Attempts versus successful privilege use.

### 6. Vault — “Were credentials touched?”

| What appears              | What it means                                 |
| ------------------------- | --------------------------------------------- |
| Secret created / replaced | New credential material entered the workspace |
| Secret revoked / deleted  | Credential path closed or destroyed           |
| Vault access denied       | Attempt to use vault without permission       |

**Operator understanding:** Whether unauthorized access reached the credential layer. Values are never shown — only that the lifecycle event happened.

### 7. Abuse / Security Platform — “Was the door kicked first?”

| What appears                 | What it means                             |
| ---------------------------- | ----------------------------------------- |
| Throttled sensitive requests | Flood / spray before or during the window |
| Shaped denials               | Hostile probing refused at the edge       |

**Operator understanding:** Broader attack context around the account timeline.

### 8. Workspace / Configuration — “Did tenancy or posture change?”

| What appears                                        | What it means               |
| --------------------------------------------------- | --------------------------- |
| Workspace-scoped deny (when emitted)                | Boundary held or was probed |
| Configuration / posture events (when emitted later) | Security posture changed    |

**Operator understanding:** Whether the incident was only one account or a wider posture change. Many Configuration examples arrive only with later packages.

---

## How the operator understands “what happened”

A usable investigation ends in a short story the Administrator can tell without engineers:

1. **Entry:** sign-in / recovery / session evidence shows how access began
2. **Persistence:** sessions show how long access lasted and whether it was revoked
3. **Escalation:** privilege / authorization show whether power increased
4. **Credential impact:** vault shows whether secrets were created or destroyed
5. **Pressure:** abuse / platform shows whether the account was attacked noisily

If the timeline supports that story with times and actors, the Security Audit Product is investigation-ready for Wave 1.

If the Administrator still needs SSH to answer those five points for events S01–S04 already emit, S05 is not done.

---

## What will still be missing (honest gaps)

These gaps are expected. Naming them prevents false confidence.

| Missing for this scenario                           | Why it is missing                          | When it appears                                                                       |
| --------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Live order / cancel / kill “who clicked trade”      | Financial action log is not S05            | **V3-L03** (Wave 6)                                                                   |
| Full live tamper-evident financial proof            | SEC-16 completes with live financial audit | **V3-L03** / SEC-16                                                                   |
| Connection connect/disconnect history               | Connection Management not Wave 1           | **Wave 2** (`V3-C01`…`C04`)                                                           |
| Monitoring alerts (“notify me when lockouts spike”) | Audit ≠ monitoring                         | **V3-O05** (Wave 3)                                                                   |
| Grafana / metrics dashboards                        | Out of S05                                 | Wave 3 / host ops                                                                     |
| Isolation suite as a finished product proof         | Different Wave 1 package                   | **V3-S06**                                                                            |
| Rich device fingerprint / geo product               | Not promised as S05 customer outcome       | Later / host-dependent — only what emitters already provide (e.g. IP/UA when present) |
| Proof against a fully compromised database host     | Honest integrity limit                     | Never claimed as a customer guarantee in S05                                          |

For an **unauthorized account access** suspicion before live trading exists, Wave 1 Security Audit should still be enough to investigate identity, sessions, recovery, privilege, and vault impact. It will **not** be enough to reconstruct live capital actions — and must not pretend otherwise.

---

## Pass / fail for product fitness

| Result              | Meaning                                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PASS**            | Administrator can walk this scenario in the product and reconstruct entry → persistence → escalation → credential impact without SSH                                              |
| **REQUIRES ACTION** | Events exist only as engineering logs; search cannot isolate the person/time; secrets appear; history is editable; or the UI claims live/monitoring completeness it does not have |

This walkthrough may be reused at S05 Product Review / Validation as a manual investigation check alongside the Security Audit Walkthrough.

---

**STOP.** Planning artifact only. Wait for implementation slices after S05 Approval; do not treat this file as code authorization by itself.
