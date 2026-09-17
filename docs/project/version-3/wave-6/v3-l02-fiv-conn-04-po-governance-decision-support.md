# FIV-CONN-04 PO/Governance Decision Support

**Document:** FIV-CONN-04 PO/Governance Decision Support — D-CONN-04-01…10  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04 — LIVE environment backfill / residual migration state  
**Authority:** Repository-side Architecture / Security / Engineering Decision-Support Analyst  
**Nature:** **GOVERNANCE / DECISION SUPPORT ONLY.** Presents options and consequences for PO/Governance. Does **not** freeze decisions. Does **not** grant Slice Approval. Does **not** authorize implementation. Does **not** create migrations, mutate Connections/Vault/credentials, perform backfill, or authorize FIV/C7/venue I/O/capital.

**Planning Package:** [`v3-l02-fiv-conn-04-planning-package.md`](./v3-l02-fiv-conn-04-planning-package.md) (`356a8a2…`)  
**Planning Review:** [`v3-l02-fiv-conn-04-planning-review.md`](./v3-l02-fiv-conn-04-planning-review.md) (`b5308c3…`) — **PASS WITH REQUIRED PO DECISIONS**  
**Repository baseline:** `b5308c3a96061b2de65ae59cfcbc87f38886e6be` (`HEAD == origin/main`)

```text
DECISION SUPPORT — NOT DECISION FREEZE
PO decisions D-CONN-04-01…10: OPEN
Implementation: NOT AUTHORIZED
Next gate: PO/GOVERNANCE DECISION REVIEW
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Governance Context

```text
CLOSED:
  FIV-CRED-01
  FIV-CONN-01
  FIV-CONN-02
  FIV-CONN-03

FIV-CONN-04:
  Planning Package: SYNCED
  Planning Review:  PASS WITH REQUIRED PO DECISIONS

FIV-PRE-01:
  NOT CLOSED

FIV:
  NOT AUTHORIZED / NOT PERFORMED
```

### Authoritative inputs for this support brief

| Artifact                     | Role                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| FIV-CONN-04 Planning Package | Options + residual technical sequence                           |
| FIV-CONN-04 Planning Review  | Architecture/security PASS WITH CONDITIONS; PO freezes required |
| FIV-CRED-02 Decision Freeze  | D-CRED-02-04/05/09/12 parent ownership                          |
| FIV-CONN-03 Decision Freeze  | Model C, NULL EXCHANGE fail-closed, vaultSecretId binding       |
| FIV-CONN-01/02/03 Closures   | Closed deliverables must not be redesigned                      |

### Purpose

Enable PO/Governance to **explicitly freeze** D-CONN-04-01…10.  
This artifact does **not** label any option “approved” unless already frozen in a prior artifact.

---

## 2. Current Repository Evidence

### Data model (FACT)

| Item                           | State                                                  |
| ------------------------------ | ------------------------------------------------------ |
| `ConnectionRecord.environment` | `String?` — still nullable                             |
| Logical identity               | `workspaceId + provider + environment`                 |
| `vaultSecretId`                | Credential reference only — **not** logical uniqueness |
| Strategy B                     | Partial unique index **already implemented** (CONN-02) |
| Model C use path               | Implemented (CONN-03); EXCHANGE + NULL → FAIL CLOSED   |
| Application env mutation API   | Absent (immutable after create; D-CRED-02-09)          |
| LIVE backfill                  | **NOT PERFORMED**                                      |

### Local inventory (planning evidence only — NOT production certification)

| Metric                                                  | Local value                    |
| ------------------------------------------------------- | ------------------------------ |
| Total Connections                                       | 13                             |
| All `environment IS NULL`                               | Yes                            |
| EXCHANGE NULL                                           | 4                              |
| Credentialed EXCHANGE with LIVE-class purpose `trading` | 1                              |
| Metadata-only EXCHANGE                                  | 3                              |
| Populated LIVE / TESTNET                                | 0 / 0                          |
| Local purpose conflicts                                 | 0                              |
| NOTIFICATION NULL                                       | 9 (out of LIVE backfill scope) |

Planning Review re-verified these local counts. Production/staging may differ; target-environment audit is mandatory before any authorized write.

### Sequence residual (FACT)

Parent D-CRED-02-05 ideal order placed Strategy B **after** backfill.  
Actual: CONN-02 uniqueness **before** CONN-04 backfill.  
CONN-04 must therefore **audit Strategy B collisions before** assigning `live` to credentialed NULL rows.

---

## 3. Frozen Architectural Invariants

These are **already approved** and must not be redesigned by CONN-04 decisions:

```text
Model C:
  Connection.environment
    → expected purpose class
    → exact vaultSecretId
    → Vault metadata
    → actual SecretPurpose
    → FAIL CLOSED on mismatch

Vault SecretPurpose  = runtime credential/environment SoT
Connection.environment = constraint / audit context

Strategy B = DB uniqueness authority for credentialed,
  non-revoked, EXCHANGE, environment IS NOT NULL rows
  on (workspaceId, provider, environment)

NULL ≠ LIVE
No provider-only lookup
No sibling-secret substitution
No cross-workspace / cross-environment fallback
No Vault mutation during backfill
No vaultSecretId replacement during backfill
No LIVE↔TESTNET rewrite
DEMO deferred for Connections
C7 DENY-ALL / allowRealVenueIo=false unchanged by CONN-04
```

CONN-04 decisions refine **policy for residual migration**, not Model C / Strategy B architecture.

---

## 4. D-CONN-04-01 — LIVE Evidence Bar

### Decision question

What evidence is sufficient to classify a NULL-environment EXCHANGE Connection as eligible for LIVE backfill (`environment NULL → live`)?

### Current evidence

- Planning Package + Review: strongest evidence = exact `vaultSecretId` → Vault purpose ∈ `{trading, trading_live}` with workspace match.
- D-CRED-02-04 (FROZEN): backfill unambiguous LIVE-class; never auto-classify ambiguous; zero Vault mutation.
- CRED-02 Architecture historically treated metadata-only EXCHANGE as “LIVE **semantics**” via omit-purpose path — **weaker** than CONN-04 Vault-evidence bar.
- Provider / connectionType / status alone are **insufficient** (cannot prove LIVE vs TESTNET-class secret, cannot prove Model C compatibility).

### Why provider/type alone fails

| Weak signal                   | Failure mode                               |
| ----------------------------- | ------------------------------------------ |
| `provider = BINANCE`          | May bind LIVE or TESTNET purpose later     |
| `connectionType = EXCHANGE`   | Environment still NULL; CONN-03 denies use |
| Status (`DISCONNECTED`, etc.) | Lifecycle ≠ environment class              |
| Metadata-only row             | No Vault purpose to assert Model C         |

### Options (from Planning Package)

| Option | Definition                                                        |
| ------ | ----------------------------------------------------------------- |
| **A**  | Vault-proven only: bound purpose ∈ `{trading, trading_live}`      |
| **B**  | Vault-proven **or** metadata-only EXCHANGE (parent-era semantics) |
| **C**  | Vault-proven + explicit operator allowlist IDs                    |

### Consequences

| Dimension  | A                                              | B                        | C                                 |
| ---------- | ---------------------------------------------- | ------------------------ | --------------------------------- |
| Technical  | Strict classifier; metadata-only remain NULL   | Broader UPDATE set       | Hybrid; allowlist ops burden      |
| Security   | Highest evidence fidelity; aligns Model C      | Over-classification risk | High if allowlist controlled      |
| Migration  | Smaller eligible set locally (1 of 4 EXCHANGE) | May LIVE-ify 3 ambiguous | Controlled expansion              |
| FIV-PRE-01 | Unrelated NULL EXCHANGE may remain fail-closed | Fewer residuals          | Residuals only if not allowlisted |

### Architecture / Security position (documented, not frozen)

- Architecture (Planning Review / AQ-04-01): Option **A** recommended as strongest bar.
- Security: Option **A** preferred; B requires accepting historical assumption without Vault proof.
- Parent D-CRED-02-04 does **not** by itself freeze A vs B vs C for CONN-04 slice evidence.

### Residual uncertainty

- Production may contain TESTNET-purpose bindings not seen locally.
- Option B conflicts with CONN-04 “no type-only LIVE” planning rule unless PO explicitly freezes it.

### PO decision required

**YES — D-CONN-04-01 OPEN.** Explicit freeze of A / B / C (or refined hybrid).

---

## 5. D-CONN-04-02 — Ambiguous NULL Handling

### Decision question

What happens to NULL-environment EXCHANGE records that cannot be classified confidently under the frozen evidence bar?

### Current evidence

- Planning Package: must **not** silently convert to LIVE.
- Options: remain NULL + fail closed; quarantine + operator review; defer to separate remediation slice.
- CONN-03 / D-CONN-03-03 (FROZEN): EXCHANGE + NULL → FAIL CLOSED on validate/handshake; NULL ≠ LIVE.
- Planning Review: “quarantine” must not invent a new runtime exception/waiver path.

### Options

| Option | Definition                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| **A**  | Remain NULL + fail closed (CONN-03 behavior continues)                                                         |
| **B**  | Audit quarantine list + operator review workflow; rows still remain NULL until reclassified under D-CONN-04-01 |
| **C**  | Defer ambiguous remediation to a separate slice; CONN-04 backfills only Vault-proven LIVE                      |

**Scope note:** If “quarantine” means only durable audit disposition + remain NULL, it is **not** new architecture. If it means a new runtime bypass / waiver flag allowing credential use while NULL, that is **scope expansion** and must be rejected or separately authorized (not recommended).

### Consequences

| Dimension     | A                                                | B                                                 | C                          |
| ------------- | ------------------------------------------------ | ------------------------------------------------- | -------------------------- |
| Safety        | Highest continuity with CONN-03                  | Same runtime safety if remain NULL                | Same                       |
| Security      | No silent LIVE                                   | No silent LIVE; needs clear quarantine definition | No silent LIVE             |
| Migration     | Residuals remain                                 | Residuals + review queue                          | Narrower CONN-04 write set |
| Ops usability | Ambiguous EXCHANGE unusable for trading validate | Explicit operator path                            | Deferred cleanup           |
| FIV-PRE-01    | Depends on D-CONN-04-10                          | Same                                              | Same                       |

### Architecture / Security position

- Prefer **A** or **A+B (audit-only quarantine)**; forbid waiver/bypass.
- Do not introduce exception mechanism that weakens fail-closed.

### PO decision required

**YES — D-CONN-04-02 OPEN.** Choose A / B / C and define quarantine as audit-only if B.

---

## 6. D-CONN-04-03 — Purpose Mismatch

### Decision question

What happens when Connection environment context and exact Vault `SecretPurpose` do not agree (classification-time or use-time)?

### Current evidence

- Model C already FROZEN (CONN-03 / CRED-02): mismatch → **FAIL CLOSED**.
- Planning Package options for **classification-time** (NULL proposing LIVE): quarantine+skip / abort entire backfill / manual remediation only.
- **No Vault mutation. No credential substitution.**

### Compatibility matrix (already frozen at use-time)

| Connection env | Actual Vault purpose       | Use-time           |
| -------------- | -------------------------- | ------------------ |
| LIVE           | `trading` / `trading_live` | ALLOW (id-matched) |
| LIVE           | `trading_testnet`          | DENY               |
| TESTNET        | `trading_testnet`          | ALLOW              |
| TESTNET        | `trading` / `trading_live` | DENY               |
| NULL EXCHANGE  | any trading purpose        | DENY               |

### Classification-time (CONN-04 write) vs use-time

| Phase          | Behavior that must remain                                |
| -------------- | -------------------------------------------------------- |
| Classification | Do not write `live` if bound purpose is not LIVE-class   |
| Use-time       | CONN-03 Model C remains authoritative after any backfill |

### Options (classification-time batch policy)

| Option | Definition                                                      |
| ------ | --------------------------------------------------------------- |
| **A**  | Skip/quarantine mismatched rows; continue eligible updates      |
| **B**  | Abort entire backfill batch on first mismatch                   |
| **C**  | Manual remediation only (no automated write for mismatched set) |

### Consequences

| Dimension  | A                                            | B                           | C           |
| ---------- | -------------------------------------------- | --------------------------- | ----------- |
| Technical  | Partial progress + residual list             | All-or-nothing              | Slowest     |
| Security   | Fail closed preserved                        | Fail closed + stronger halt | Fail closed |
| Migration  | Forward progress for clean rows              | May block on one bad row    | Manual      |
| FIV-PRE-01 | Clean LIVE rows can proceed if policy allows | May delay                   | May delay   |

### Architecture / Security position

- Confirm Model C; do **not** redesign.
- PO chooses batch abort vs skip, not whether mismatch is allowed (forbidden).

### Already frozen vs remaining PO

| Aspect                              | Status                       |
| ----------------------------------- | ---------------------------- |
| Use-time FAIL CLOSED                | **Already frozen** (CONN-03) |
| No Vault repair / no sibling select | **Already frozen**           |
| Batch skip vs abort                 | **PO policy remaining**      |

### PO decision required

**YES — D-CONN-04-03 OPEN** for classification-time batch disposition (A/B/C). Model C itself is not reopened.

---

## 7. D-CONN-04-04 — Revoked / Dangling Credentials

### Decision question

What happens if `vaultSecretId` is missing, dangling, revoked, invalid-purpose, or workspace-mismatched during classification/backfill?

### Current evidence

- CONN-03 / CRED-01: missing/revoked/wrong workspace / id mismatch → FAIL CLOSED on credential use; no sibling/provider fallback.
- Planning Package: dangling/mismatch → quarantine; revoked → exclude from auto-LIVE unless explicitly frozen.
- Strategy B excludes `status = REVOKED` from uniqueness, but writing `environment=live` on revoked rows still changes audit semantics.

### Case table

| Case                         | Use-time (frozen)               | Classification-time options                               |
| ---------------------------- | ------------------------------- | --------------------------------------------------------- |
| Missing `vaultSecretId`      | No credential use               | Not Vault-proven LIVE (under Option A of 04-01)           |
| Dangling `vaultSecretId`     | DENY                            | Skip/quarantine; never invent sibling                     |
| Revoked                      | DENY / excluded from Strategy B | Exclude auto-LIVE (recommended) vs include env write only |
| Invalid / unexpected purpose | DENY                            | Treat as mismatch (04-03)                                 |
| Other-workspace secret       | DENY                            | Block; never cross-workspace write                        |

### Options

| Option | Definition                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------- |
| **A**  | Skip/quarantine all defective bindings; never auto-LIVE                                                  |
| **B**  | Same as A, plus explicit PO allowlist for rare revoked metadata writes (env only, still no Vault repair) |
| **C**  | Abort backfill if any dangling/workspace mismatch found in target inventory                              |

### Consequences

| Dimension  | Notes                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| Security   | A/C preserve fail-closed; B needs tight allowlist to avoid audit confusion         |
| Migration  | Defective rows remain NULL (usable only after separate remediation)                |
| FIV-PRE-01 | Defective EXCHANGE remain fail-closed; should not be “repaired” into LIVE silently |

### Architecture / Security position

- Use-time fail-closed: **already frozen**.
- CONN-04 must not rebind credentials or mutate Vault.
- PO freezes whether revoked rows may receive env metadata write at all.

### PO decision required

**YES — D-CONN-04-04 OPEN** for classification disposition. Core fail-closed use behavior is already frozen.

---

## 8. D-CONN-04-05 — Strategy B Collisions

### Decision question

What happens when an eligible NULL→LIVE backfill would collide with an existing credentialed LIVE Connection under Strategy B?

### Current evidence

- Strategy B FROZEN and implemented.
- Planning Package: block write; do not substitute credentials; fail closed; surface collision.
- No automatic duplicate cleanup authorized.
- Distinguish **prevention** (pre-audit + conditional UPDATE + DB unique) from **resolution** (manual / separate slice).

### Options

| Option | Definition                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| **A**  | Prevention only: skip colliding candidates; report blocked IDs; continue non-colliding eligible updates      |
| **B**  | Abort entire backfill if any Strategy B collision projected                                                  |
| **C**  | Require separate remediation/cleanup slice before any colliding write (cleanup **not** auto-authorized here) |

### Consequences

| Dimension  | A                                 | B             | C                          |
| ---------- | --------------------------------- | ------------- | -------------------------- |
| Technical  | Partial progress                  | Halt          | Blocks until remediation   |
| Security   | No overwrite/substitution         | Strong halt   | Strongest process gate     |
| Migration  | Residuals remain                  | May delay all | Explicit cleanup ownership |
| FIV-PRE-01 | Non-colliding LIVE may still land | May delay     | May delay                  |

### Architecture / Security position

- Do **not** replace Strategy B.
- DB unique remains final authority under concurrency.
- Collision **resolution** (delete/merge/rebind) is **out of default CONN-04 scope** unless separately authorized.

### PO decision required

**YES — D-CONN-04-05 OPEN** for prevention vs abort vs gated remediation. Strategy B itself is not reopened.

---

## 9. D-CONN-04-06 — Residual NULL Policy

### Decision question

After FIV-CONN-04, may Connections remain with `environment = NULL`?

### Current evidence

Must separate:

| Class             | Current approved semantics                                        |
| ----------------- | ----------------------------------------------------------------- |
| EXCHANGE NULL     | Fail closed on trading validate/handshake (CONN-03)               |
| NON-EXCHANGE NULL | Allowed / normal (notification/AI); **not** LIVE backfill targets |

Planning Package options for EXCHANGE: yes (fail-closed residual) / no (forces classification or deletion — deletion out of default scope).

### Options (EXCHANGE-focused)

| Option | Definition                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------- |
| **A**  | EXCHANGE NULL may remain after backfill (documented residuals; fail closed)                              |
| **B**  | EXCHANGE NULL must not remain (forces 04-01/02 disposition of all EXCHANGE rows before CONN-04 complete) |
| **C**  | NON-EXCHANGE NULL always allowed; EXCHANGE per A or B                                                    |

(Option C is the correct cross-cutting framing: non-EXCHANGE should not be forced LIVE.)

### Consequences

| Dimension        | A                                             | B                                     |
| ---------------- | --------------------------------------------- | ------------------------------------- |
| Safety           | Residuals stay fail-closed                    | Requires full EXCHANGE classification |
| Ops              | Some EXCHANGE unusable until remediated       | Cleaner inventory                     |
| NOT NULL (04-07) | Incompatible with DB NOT NULL on all EXCHANGE | Prerequisite for NOT NULL             |
| FIV-PRE-01       | Depends on 04-10                              | Stronger “migration complete” story   |

### Architecture / Security position

- Do **not** assume all NULL → LIVE.
- Non-EXCHANGE NULL should remain allowed.
- Architecture can support A; B is a completeness policy choice.

### PO decision required

**YES — D-CONN-04-06 OPEN.**

---

## 10. D-CONN-04-07 — NOT NULL Scope

### Decision question

Should FIV-CONN-04 make EXCHANGE `Connection.environment` NOT NULL (DB and/or app)?

### Current evidence

- Parent D-CRED-02-03/05 expected eventual EXCHANGE NOT NULL after backfill.
- Schema today still nullable.
- Planning Package: 04-E **conditional**; only if residual NULL policy allows.
- Planning Review: do not approve blanket NOT NULL for attractiveness alone.

### Options

| Option | Definition                                                                          |
| ------ | ----------------------------------------------------------------------------------- |
| **A**  | Keep nullable in CONN-04; defer NOT NULL                                            |
| **B**  | Enforce EXCHANGE NOT NULL after controlled backfill + residual resolution           |
| **C**  | App-only enforcement (create already requires env); no DB CHECK/NOT NULL in CONN-04 |

### Prerequisites for Option B

1. D-CONN-04-06 chooses “no residual EXCHANGE NULL” (or equivalent disposition).
2. All in-scope EXCHANGE rows classified under 04-01/02/03/04.
3. Non-EXCHANGE NULL semantics remain understood (exempt).
4. Migration safety + write gate demonstrated.
5. Explicit PO approval of 04-E.

### Consequences

| Dimension  | A                                      | B                                | C              |
| ---------- | -------------------------------------- | -------------------------------- | -------------- |
| Technical  | Lowest risk now                        | Hard invariant                   | Soft invariant |
| Security   | Relies on CONN-03 fail-closed for NULL | Prevents new NULL EXCHANGE at DB | App paths only |
| Migration  | Simpler CONN-04                        | Extra hardening step             | Medium         |
| FIV-PRE-01 | Incomplete migration story possible    | Stronger completeness            | Medium         |

### Architecture / Security position

- Prefer **A or C** unless residuals cleared; **B only** when prerequisites met.
- NOT NULL is **not** automatically required for CONN-04 closure of residual LIVE backfill objective.

### PO decision required

**YES — D-CONN-04-07 OPEN.**

---

## 11. D-CONN-04-08 — Concurrency / Write Gate

### Decision question

What exact concurrency/write controls are required for future authorized backfill?

### Current evidence

- D-CRED-02-12 **FROZEN**: application write gate during migration critical section; deny credential store/replace/revoke (and EXCHANGE create **if needed**); single transactional steps; maintenance window; advisory locks alone insufficient.
- Planning Package: conditional `UPDATE … WHERE environment IS NULL` + unchanged `vaultSecretId`; Strategy B final DB authority; single-runner job.

### Minimum safe write gate (compatible with approved architecture)

```text
1. Maintenance window (operational)
2. Application write gate ON:
   - deny Connection credential store/replace/revoke
   - deny EXCHANGE create (recommended — removes new competitor rows)
3. Single-runner backfill
4. Per-row / batched conditional UPDATE:
     environment IS NULL
     AND vault_secret_id IS NOT DISTINCT FROM expected
     AND connection_type = 'EXCHANGE'
5. Re-check eligibility + Strategy B projection immediately before write
6. On unique violation / unexpected mismatch: abort closed / skip per 04-03/05
7. Write gate OFF only after verification counters pass
```

### Options for PO freeze of exact deny set

| Option | Definition                                                                   |
| ------ | ---------------------------------------------------------------------------- |
| **A**  | Deny store/replace/revoke only; allow EXCHANGE create                        |
| **B**  | Deny store/replace/revoke **and** EXCHANGE create (recommended minimum-safe) |
| **C**  | Broader freeze including rename/lifecycle status changes during window       |

### Consequences

| Dimension  | A                                 | B                               | C                      |
| ---------- | --------------------------------- | ------------------------------- | ---------------------- |
| Race risk  | Higher (new EXCHANGE live create) | Lower                           | Lowest ops flexibility |
| Ops impact | Narrower                          | Medium                          | Highest                |
| Security   | May race Strategy B               | Aligns D-CRED-02-12 “if needed” | Strong                 |

### Architecture / Security position

- D-CRED-02-12 already requires a gate; PO freezes **breadth**.
- Architecture/Security recommend **B** as minimum safe.

### PO decision required

**YES — D-CONN-04-08 OPEN** for exact deny set (A/B/C). Parent requirement to have a gate is already frozen.

---

## 12. D-CONN-04-09 — Audit / Observability

### Decision question

What must be auditable when CONN-04 eventually performs classification/backfill?

### Current evidence

- Planning Package counters: scanned, eligible, updated, skipped, ambiguous, blocked, mismatched, duplicate, failed.
- Security: never log API keys, secrets, tokens, decrypted material.
- Repository has Security Audit store patterns (workspace/actor/resource/outcome/correlation) — CONN-04 need not invent a parallel secret-bearing logger.

### Required security audit fields (recommended minimum)

| Field                     | Notes                                        |
| ------------------------- | -------------------------------------------- |
| Connection id             | Required                                     |
| workspaceId               | Required                                     |
| provider / connectionType | Required                                     |
| previous environment      | null / live / testnet                        |
| new environment           | live or unchanged                            |
| evidence class            | e.g. vault-proven LIVE / ambiguous / blocked |
| vaultSecretId reference   | opaque id only — **no secret material**      |
| Vault purpose (metadata)  | optional string enum; never payload          |
| actor / system identity   | operator or migration job id                 |
| timestamp                 | Required                                     |
| correlation / request id  | where available                              |
| outcome                   | updated / skipped / blocked / failed         |
| failure/collision reason  | code, not secret                             |

### Options

| Option | Definition                                                |
| ------ | --------------------------------------------------------- |
| **A**  | Security-required fields only (table above) + counters    |
| **B**  | A + durable Security Audit events per updated/blocked row |
| **C**  | A + B + operator sign-off / retention policy freeze       |

### Distinguish

| Class                        | Content                                                |
| ---------------------------- | ------------------------------------------------------ |
| Required security audit      | Who changed what env, why (evidence class), no secrets |
| Optional operational logging | Verbose run logs, dashboards                           |

### Architecture / Security position

- Prefer at least **A**; **B/C** strengthen governance closure.
- Do not create mechanism in this act.

### PO decision required

**YES — D-CONN-04-09 OPEN** for A/B/C depth, retention, and sign-off authority.

---

## 13. D-CONN-04-10 — FIV-PRE-01 Blocking Relationship

### Decision question

Does unresolved Connection environment state block FIV-PRE-01 completion / readiness?

### Current evidence

- FIV-PRE-01: Binance Testnet credential architecture path; NOT CLOSED; CONN-04 does **not** auto-close PRE-01 or authorize FIV.
- PRE-01 implementation authorization distinguishes Testnet binding / Model C / uniqueness from full FIV execution.
- Planning Package options: unresolved NULL EXCHANGE blocks PRE-01 / only blocks EXCHANGE NOT NULL / PRE-01 can proceed with documented fail-closed residuals.
- Distinguish **repository-wide migration completeness** vs **specific FIV Testnet preflight readiness**.

### Options

| Option | Definition                                                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**  | Unresolved EXCHANGE NULL / migration incompleteness **blocks** PRE-01 closure                                                                       |
| **B**  | PRE-01 may proceed if the **specific Binance Testnet** Connection path is coherent; unrelated residual NULL EXCHANGE are non-blocking if documented |
| **C**  | Unresolved residuals only block EXCHANGE NOT NULL (04-07), not PRE-01                                                                               |

### Consequences

| Dimension | A                                       | B                                     | C                            |
| --------- | --------------------------------------- | ------------------------------------- | ---------------------------- |
| Safety    | Strongest global coherence              | Focused on FIV Testnet path           | Weakest PRE-01 coupling      |
| Ops       | May delay PRE-01 on unrelated leftovers | Faster PRE-01 progress                | Separates concerns           |
| Security  | Avoids “migration done” fiction         | Requires clear inventory of residuals | Residuals remain fail-closed |
| FIV       | Still does **not** authorize FIV itself | Same                                  | Same                         |

### Architecture / Security position

- CONN-04 never authorizes FIV / C7 / venue I/O / capital.
- Architecture can support B for Testnet-focused PRE-01 if residuals are inventoried and fail-closed.
- A is stricter completeness policy.

### PO decision required

**YES — D-CONN-04-10 OPEN.** Do not conflate CONN-04 completion with FIV authorization.

---

## 14. Cross-Cutting Decision Matrix

| Decision                   | Safety impact             | Security impact            | Migration impact   | FIV-PRE-01 impact           | Architecture position                | PO required |
| -------------------------- | ------------------------- | -------------------------- | ------------------ | --------------------------- | ------------------------------------ | ----------- |
| **04-01** LIVE evidence    | Prevents false LIVE       | High — Model C fidelity    | Eligible set size  | Residuals if strict         | Prefer Vault-proven (A)              | **YES**     |
| **04-02** Ambiguous NULL   | Keep fail-closed          | No silent LIVE             | Residual EXCHANGE  | Depends on 04-10            | Remain NULL ± audit quarantine       | **YES**     |
| **04-03** Mismatch         | Fail closed               | No Vault repair            | Skip vs abort      | Delay if abort              | Confirm Model C; choose batch policy | **YES**     |
| **04-04** Revoked/dangling | Fail closed               | No rebind/fallback         | Residuals          | Non-usable leftovers        | Exclude auto-LIVE                    | **YES**     |
| **04-05** Collisions       | No overwrite              | Strategy B authority       | Blocked IDs        | May delay                   | Prevention; no auto-cleanup          | **YES**     |
| **04-06** Residual NULL    | EXCHANGE unusable if NULL | NULL ≠ LIVE                | Completeness       | Couples to 04-10/07         | Non-EXCHANGE stay NULL               | **YES**     |
| **04-07** NOT NULL         | Hard invariant if chosen  | Prevents new NULL EXCHANGE | Extra step         | Completeness signal         | Conditional only                     | **YES**     |
| **04-08** Write gate       | Race prevention           | Avoid ambiguous identity   | Maintenance window | Indirect                    | Prefer deny create+cred writes       | **YES**     |
| **04-09** Audit            | Operator clarity          | Non-exposure               | Closure proof      | Evidence for PRE-01 debates | Min fields + counters                | **YES**     |
| **04-10** PRE-01 block     | Policy coupling           | Avoid false readiness      | Process gate       | Direct                      | Distinguish Testnet path vs global   | **YES**     |

---

## 15. Risks

| ID   | Risk                                         | Evidence basis                                              | Mitigation via PO freeze                               |
| ---- | -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| R-01 | Over-classification of metadata-only as LIVE | Local 3 ambiguous EXCHANGE; parent-era semantics temptation | Freeze 04-01 A (or C), reject silent B unless explicit |
| R-02 | Ambiguous metadata left unmanaged            | CONN-03 fail-closed already                                 | Freeze 04-02                                           |
| R-03 | Local inventory ≠ production                 | Explicit planning caveat                                    | Mandatory target audit before write                    |
| R-04 | Strategy B collisions after LIVE assign      | Uniqueness already live                                     | Freeze 04-05 prevention/abort                          |
| R-05 | Concurrent writes during backfill            | D-CRED-02-12                                                | Freeze 04-08 deny set                                  |
| R-06 | Stale classification overwrite               | Race with create/store                                      | `environment IS NULL` + write gate                     |
| R-07 | Revoked/dangling treated as LIVE             | Status/identity edge cases                                  | Freeze 04-04                                           |
| R-08 | Residual NULL misunderstood as LIVE          | CONN-03 NULL ≠ LIVE                                         | Freeze 04-06 + operator docs                           |
| R-09 | Premature NOT NULL                           | Residuals may remain                                        | Freeze 04-07 conditional                               |
| R-10 | PRE-01 dependency ambiguity                  | PRE-01 vs migration completeness                            | Freeze 04-10                                           |

No production incidents invented.

---

## 16. Uncertainties / Local-vs-Production Limitations

```text
LOCAL (planning/review verified):
  13 Connections, all NULL env
  1 Vault-proven LIVE-class EXCHANGE
  3 metadata-only ambiguous EXCHANGE
  0 local purpose conflicts

NOT PROVEN:
  production/staging inventory
  production Strategy B collision set
  production dangling/revoked counts
  production TESTNET-purpose bindings
```

Any future authorized implementation must re-run read-only audit on the **target** environment before writes.  
Decision freezes should be environment-policy-stable even when counts differ.

---

## 17. Consolidated PO Decision Checklist

```text
D-CONN-04-01 — LIVE evidence bar:                    OPEN
D-CONN-04-02 — Ambiguous NULL handling:              OPEN
D-CONN-04-03 — Purpose mismatch (batch policy):      OPEN
D-CONN-04-04 — Revoked / dangling credentials:       OPEN
D-CONN-04-05 — Strategy B collisions:                OPEN
D-CONN-04-06 — Residual NULL policy:                 OPEN
D-CONN-04-07 — NOT NULL scope:                       OPEN
D-CONN-04-08 — Concurrency / write gate deny set:    OPEN
D-CONN-04-09 — Audit / observability depth:          OPEN
D-CONN-04-10 — FIV-PRE-01 blocking relationship:     OPEN
```

**No decisions are pre-frozen by this artifact.**

Already frozen upstream (do not reopen): Model C fail-closed; Strategy B; NULL ≠ LIVE for EXCHANGE use; vaultSecretId exact binding; no Vault mutation; D-CRED-02-12 requirement for a write gate; environment immutability outside migration exception.

---

## 18. Next Governance Gate

```text
Next gate:
FIV-CONN-04 PO/GOVERNANCE DECISION REVIEW
→ PO Decision Freeze for D-CONN-04-01…10
```

After freeze: Architecture/Security confirmation as required by governance ladder → Slice Approval (separate) → Implementation (only if authorized).

This support brief does **not**:

- freeze decisions
- create Slice Approval
- authorize implementation
- create migrations / perform backfill
- close FIV-CONN-04 or FIV-PRE-01
- authorize FIV

---

## Safety State (this act)

```text
External I/O:       ZERO
FIV:                NOT PERFORMED
Capital:            ZERO
C7:                 DENY-ALL
allowRealVenueIo:   FALSE
Vault:              NOT MODIFIED
Credentials:        NOT MODIFIED
Database:           NOT MODIFIED
LIVE backfill:      NOT PERFORMED
Protected leftovers: UNTOUCHED
```

---

**END OF FIV-CONN-04 PO/GOVERNANCE DECISION SUPPORT**
