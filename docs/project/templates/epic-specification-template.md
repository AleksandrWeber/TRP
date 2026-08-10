# Epic Specification — Template

**Release:** RC-17  
**Epic:** E?? — _name_  
**Date:** YYYY-MM-DD  
**Status:** DRAFT | ACCEPTED | SUPERSEDED  
**Epic owner:**  
**Architecture baseline:** ADR-012…ADR-018 (ACTIVE)

Related:

- [Product Vision](../trp-product-vision.md) — Level-0 product authority
- [UX Vision](../trp-ux-vision.md) — Level-0 experience authority
- [RC-17 Roadmap](../rc-17-roadmap.md)
- [RC-17 Development Process — Stage 1](../rc-17-development-process.md)
- [Story ID Allocation](../story-id-allocation.md) — assign IDs from **US240–US299** only
- [ADL](../../Architecture/ADR/ADL.md)

Cite Level-0 Visions in Objective / Expected business value / Out of scope when
product intent or UX outcomes are material. Do not contradict them.

---

## 1. Objective

_One paragraph: what this epic delivers for Production Readiness & Operational Runtime._

---

## 2. Architectural goal

_How this epic extends (not replaces) RC-16 architecture. Cite ADRs/invariants._

---

## 3. Expected business value

-

---

## 4. In scope

-

---

## 5. Out of scope

_Explicitly list forbidden redesigns (Orders/Risk/Execution/Accounting ownership, real-capital, new buses, etc.)._

-

---

## 6. User Stories

| ID    | Title | Depends on | ADR / invariants | Priority |
| ----- | ----- | ---------- | ---------------- | -------- |
| US??? |       |            |                  |          |

### Story sketch (optional per story)

#### US??? — Title

- **As a** …
- **I want** …
- **So that** …
- **Acceptance criteria:** 1. 2.
- **Non-goals:**
-

---

## 7. Dependencies

### Upstream (must be Done or gated)

-

### Downstream (unblocks)

-

### Debt / ADL

-

---

## 8. Risks

| Risk | Severity | Mitigation |
| ---- | -------- | ---------- |
|      |          |            |

---

## 9. Test & validation strategy

- Unit / state machine:
- Integration (PostgreSQL / Inbox / leases):
- Replay / determinism:
- Restart / recovery / chaos:
- Architecture / boundary tests:
- Performance baseline (if any):

---

## 10. Modules allowed to change

| Module | Allowed change | Forbidden |
| ------ | -------------- | --------- |
|        |                |           |

---

## 11. Proposed ADL entries

| ID      | Title | Status   |
| ------- | ----- | -------- |
| ADL-??? |       | PROPOSED |

---

## 12. Exit criteria

- [ ]
- [ ]

---

## 13. Implementation order

```text
US??? → US??? → …
```

---

## 14. Architecture Review gate

- Review date:
- Decision: PROCEED | REVISE | BLOCKED (needs ADR)
- Constraints:

---

## Sign-off

| Role               | Name | Date |
| ------------------ | ---- | ---- |
| Epic owner         |      |      |
| Architecture owner |      |      |
| Release lead       |      |      |
