# SIG-001 — Safety Integration Validation

**Release:** RC-18  
**Subject:** US293 — Durable Incident on Recovery Ambiguity  
**Date:** 2026-08-01  
**Mode:** Validate existing implementation (no production redesign)  
**Authority:** US293 Story Specification (Tech Lead **APPROVED**)  
**Decision Log:** TL-007

Related:

- [Mid-Release Health Review](./rc-18-mid-release-health-review.md)
- [RIV-001](./rc-18-riv-001-recovery-integration-validation.md)
- [Residual Register](./rc-18-residual-register.md)
- [US293](./stories/us293-durable-incident-on-recovery-ambiguity.md)

---

## Verdict

**PASS WITH RESIDUALS**

US293 correctly fail-closes the Recovery subsystem under ambiguity:

```text
Ambiguity → Incident → RecoveryState FAILED + incidentId → Session FAILED
  → Restart → Recovery blocked (FAILED not eligible)
```

Architecture ownership invariants hold. Remaining gaps are intentional
residuals for **US294**, **US295**, and **E19**.

---

## Validated paths

| Path                                                               | Result   |
| ------------------------------------------------------------------ | -------- |
| Checkpoint corruption → fail-closed → restart blocked              | **PASS** |
| Reconciliation ambiguity → fail-closed → no automatic resume       | **PASS** |
| Resume / completion blocked after READY ambiguity → Session FAILED | **PASS** |

Persist order evidenced: **Incident → RecoveryState → Session**.

---

## Architecture invariants

| Invariant                                  | Result   |
| ------------------------------------------ | -------- |
| Incident never owns Session lifecycle      | **PASS** |
| Incident never owns Recovery progress      | **PASS** |
| RecoveryState remains progress authority   | **PASS** |
| Session remains lifecycle authority        | **PASS** |
| Incident exists before Session `FAILED`    | **PASS** |
| Recovery cannot continue after Incident    | **PASS** |
| Automatic resume impossible after Incident | **PASS** |

---

## Call-site coverage

| Trigger                       | `reasonClass`                  | Owner                 |
| ----------------------------- | ------------------------------ | --------------------- |
| Invalid / corrupt checkpoint  | `checkpoint_corruption`        | Checkpoint validation |
| Reconcile mismatch            | `reconciliation_ambiguity`     | State reconciliation  |
| Lease acquire impossible      | `lease_acquire_impossible`     | Lease acquisition     |
| Resume blocked                | `resume_blocked_ambiguity`     | Runtime resume        |
| Completion blocked from READY | `completion_blocked_ambiguity` | Completion            |

Taxonomy also declares `stopping_ambiguity`, `split_brain_lease`,
`data_corruption`, `recovery_unrecoverable` — shared fail-closed centre ready;
first-class call-sites may land opportunistically (non-blocker).

---

## Residuals

| Residual                                                                                 | Owner     |
| ---------------------------------------------------------------------------------------- | --------- |
| Chaos/restart fail-safe evidence suites                                                  | **US294** |
| ADL-008 / ADL-013 governance closure                                                     | **US295** |
| Operator Incident resolve/ack/dashboard; recovery status API; Kill Switch durable policy | **E19**   |

---

## Recommendation

Accept US293 safety integration for residual sequencing. Proceed to **US294**
for chaos/restart evidence, **US295** for ADL closure, and **E19** for
operator Incident productization.
