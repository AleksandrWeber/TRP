# Technical Review — Template

**Release:** RC-17  
**Epic:** E?? — _name_  
**Date:** YYYY-MM-DD  
**Reviewer:**  
**Author(s):**  
**Verdict:** PASS | PASS WITH FIXES | FAIL

Related: [RC-17 Development Process — Stage 4](../rc-17-development-process.md) ·
[Product Vision](../trp-product-vision.md) · [UX Vision](../trp-ux-vision.md)

---

## 1. Scope reviewed

| Item                         | Value                   |
| ---------------------------- | ----------------------- |
| Stories included             | US???–US???             |
| Primary commits / PRs        |                         |
| Spec reference               | `docs/project/…`        |
| Architecture Review decision | PROCEED (+ constraints) |

### Explicitly not reviewed

-

---

## 2. Checklist

| Area                                                          | Pass? | Notes |
| ------------------------------------------------------------- | ----- | ----- |
| Meets Epic Specification / ACs                                |       |       |
| ADR-012…ADR-018 conformance                                   |       |       |
| No new execution / accounting fork                            |       |       |
| Tests adequate (unit/integration/replay/recovery as required) |       |       |
| Idempotency / duplicate delivery covered                      |       |       |
| Authorization / workspace isolation                           |       |       |
| Observability (logs/metrics/health) sufficient for epic       |       |       |
| Docs sync (status, CHANGELOG, TD, architecture notes)         |       |       |
| Performance / resource risks acceptable                       |       |       |
| Operational runbooks / operator impact understood             |       |       |

---

## 3. Correctness findings

### Blockers

| ID    | Finding | Owner | Status       |
| ----- | ------- | ----- | ------------ |
| TR-B1 |         |       | Open / Fixed |

### Non-blocking

| ID    | Finding | TD / follow-up |
| ----- | ------- | -------------- |
| TR-N1 |         |                |

---

## 4. Test evidence

| Suite / scenario                          | Result | Link / command |
| ----------------------------------------- | ------ | -------------- |
| Quality gates (lint/typecheck/build/test) |        |                |
| Replay / determinism                      |        |                |
| Restart / recovery                        |        |                |
| Boundary / architecture tests             |        |                |

---

## 5. Debt impact

| Action     | TD ID | Notes |
| ---------- | ----- | ----- |
| Resolved   |       |       |
| Introduced |       |       |
| Re-scoped  |       |       |

---

## 6. Required fixes before PASS

1.
2.

---

## 7. Recommendation

**Verdict:** PASS | PASS WITH FIXES | FAIL

**Rationale (2–4 sentences):**

**Ready for Architecture Health (Stage 5)?** Yes / No

---

## Sign-off

| Role       | Name | Date |
| ---------- | ---- | ---- |
| Reviewer   |      |      |
| Epic owner |      |      |
