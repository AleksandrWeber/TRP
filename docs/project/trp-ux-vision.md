# TRP — UX Vision

**Document:** UX Vision  
**Authority level:** **Level-0** (project experience authority)  
**Status:** Approved  
**Date recorded:** 2026-08-10  
**Scope:** Experience philosophy, UX principles, workspace model, interaction intent  
**Does not redefine:** Product purpose (Product Vision), Architecture Freeze, stack, or component library prescriptions beyond approved guidelines

Related:

- [Product Vision](./trp-product-vision.md) — Level-0 product authority
- [UI/UX Guidelines](../05-uiux-guidelines.md) — detailed design system / patterns (subordinate to this Vision)
- [CANONICAL](../CANONICAL.md) — Level-1 engineering source of truth
- [Architecture Principles](../00-architecture-principles.md)
- [ADR Index](../adr/README.md)

---

## Authority

This document is **Level-0 project UX / experience authority**.

| Rule                            | Binding                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Future ADRs                     | Cite this Vision when operator/UI authority, non-authoritative projections, or experience boundaries are material |
| Epic / Release Plans            | Align operator and research UX outcomes with this Vision (especially Operations / Dashboard epics)                |
| Story Specifications            | Reference this Vision for UI/UX Stories and for operator-facing acceptance language                               |
| Conflicts with Product Vision   | Product “what/why” wins in Product Vision; experience “how it feels/works” wins here                              |
| Conflicts with CANONICAL / ADRs | Dashboard remains non-authoritative for finance/lifecycle; Freeze and ADR-018 UI rules remain binding             |
| Detailed patterns               | [`05-uiux-guidelines.md`](../05-uiux-guidelines.md) expands this Vision; it must not contradict it                |

This Vision consolidates already approved UX philosophy. It does **not** invent a new visual brand, authorize Dashboard as financial authority, or redesign architecture.

---

## Vision statement

TRP is not a website.

TRP is not a marketing dashboard.

TRP is not a crypto exchange UI.

TRP is a **Research Operating System**.

The interface must feel like a professional engineering tool — closer to an IDE / terminal / research lab — not a consumer fintech app.

Understanding is mandatory. Decoration is secondary.

---

## Design philosophy

Prioritize, in order:

```text
Research
  → Analysis
  → Decision Making
  → Knowledge
  → Productivity
```

Visual appearance matters. Clarity of evidence matters more.

---

## Design goals

TRP UX should be:

- Scientific rather than speculative
- Explainable rather than mysterious
- Productive rather than decorative
- Calm rather than noisy
- Information-rich rather than emptily minimal
- Professional rather than playful
- Modular rather than one undifferentiated surface
- Consistent rather than surprising
- Fast rather than flashy
- **Desktop-first** (mobile supports monitoring only)

---

## Design inspiration (ideas, not skins)

Borrow interaction ideas — not visual clones — from professional tools:

VS Code · GitHub · Linear · Notion · Grafana · Bloomberg Terminal · JetBrains IDEs · TradingView (selected concepts only)

Goal: familiarity for professionals who already live in serious tools.

---

## Core UX principles

1. **Information first** — every element serves a purpose; decoration never wins.
2. **One workspace, one goal** — do not mix unrelated workflows on one surface.
3. **Progressive disclosure** — show what is needed; reveal complexity on demand.
4. **Explain everything** — metrics answer origin, importance, and calculation basis.
5. **Drill down** — summaries lead to Campaign → Experiment → Trade → raw data; no dead ends.
6. **Compare everything** — comparison is a primary research workflow.
7. **No hidden magic** — users can always answer what happened, why, and what changed.
8. **Long sessions** — reduce fatigue for hours-long research work.
9. **Keyboard first** — power-user paths without mandatory mouse use.
10. **Desktop first** — large screens are primary; mobile is secondary monitoring.

---

## Workspace model

TRP is organized around **Workspaces**, not a pile of disconnected pages.

Each workspace represents one complete activity (examples):

- Research Workspace
- Validation Workspace
- Knowledge Workspace
- Production Workspace
- AI Workspace
- Administration Workspace

The user changes **context**, not applications.

### Navigation shape

```text
Primary Navigation → Workspace → Explorer → Inspector → Details
```

Avoid deep nested menus.

### Layout shape (conceptual)

```text
Header → Toolbar → Navigation Sidebar → Main Content
  → Inspector Panel → Activity Console → Status Bar
```

Users should never feel lost about where they are or what is authoritative.

---

## Dashboard intent

The Dashboard answers one question:

> What is happening right now?

It surfaces health, research activity, campaign/validation/production status — as **projections**.

Dashboard / UI must remain **non-authoritative** for financial truth, Session lifecycle, and recovery decisions (ADR-018). Operator status APIs and richer incident UX (e.g. E19) extend visibility without making the UI the source of truth.

---

## Interaction and trust rules

- Empty and error states explain **what / why / next action**.
- Loading prefers skeletons and incremental progress over blocking screens.
- Recommendations and AI assistance must remain explainable; AI never silently executes capital actions.
- Production and recovery surfaces must preserve fail-closed semantics and never imply unsafe “heal” actions from the UI alone.

---

## Relationship to Product Vision and architecture

| Concern                                | Authority                                 |
| -------------------------------------- | ----------------------------------------- |
| Why TRP exists / who it serves         | [Product Vision](./trp-product-vision.md) |
| How TRP should feel and guide work     | **This UX Vision**                        |
| Stack / stages / MVP constraints       | [CANONICAL](../CANONICAL.md)              |
| Module ownership / Freeze / invariants | ADRs + Architecture Principles            |

UX Vision does **not** authorize redesign of Recovery, Runtime, RecoveryState, Incident, Orders, Risk, Execution, Accounting, or Canonical Order Path.

---

## Source lineage (approved)

Consolidated from approved project documents (no new UX invention):

| Source                                                              | Contribution                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`05-uiux-guidelines.md`](../05-uiux-guidelines.md)                 | Vision, philosophy, goals, principles, workspace / navigation model |
| [`00-architecture-principles.md`](../00-architecture-principles.md) | Research OS framing; explainability                                 |
| [`01-product-bible.md`](../01-product-bible.md)                     | Professional researcher audience alignment                          |

---

## Maintenance

1. Update this file when experience philosophy or workspace model changes.
2. Keep detailed tokens, component recipes, and screen patterns in [`05-uiux-guidelines.md`](../05-uiux-guidelines.md).
3. Prefer linking this Vision from ADRs, Epics, Release Plans, and Story Specs over restating it.
4. Product purpose lives in [`trp-product-vision.md`](./trp-product-vision.md).
