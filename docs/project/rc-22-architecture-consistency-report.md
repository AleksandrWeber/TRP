# RC-22 Architecture Consistency Report

**Document:** RC-22 Architecture Consistency Report  
**Status:** PLANNING REVIEW  
**Date:** 2026-08-10  
**Nature:** Conformance check of the RC-22 planning package against approved constitution. No Spec rewrite. No implementation.

**Subjects:** Implementation Plan · Epic Breakdown · Domain Model Contract · API Contract · Integration Diagram

---

## 1. Summary verdict

| Authority document                 | Consistency | Notes                                                         |
| ---------------------------------- | ----------- | ------------------------------------------------------------- |
| Architecture Specification v2.0    | **PASS**    | §5.2 responsibilities and §8 lifecycle preserved              |
| Authority Matrix                   | **PASS**    | Library = SoT for certified versions; Lake remains Projection |
| Alias Dictionary                   | **PASS**    | Bot ≡ Session; Mission ≡ Deployment; no Bot Library SoT       |
| Knowledge Lake (RC-21 CLOSED)      | **PASS**    | Optional projection consumer; never eligibility authority     |
| Engineering Workflow Standard v1.0 | **PASS**    | Plan + Domain + API before implementation                     |
| Tactics Contract (companion)       | **PASS**    | Option B envelope; Orchestrator limits respected              |

**Overall:** RC-22 planning package is **architecturally consistent**. Safe to approve for implementation gating.

---

## 2. Architecture Specification v2.0

### 2.1 §5.2 Strategy Library

| Spec requirement                                | Planning response                                      | Status |
| ----------------------------------------------- | ------------------------------------------------------ | ------ |
| Authoritative store of certified strategies     | Library SoT; Domain Model Strategy Version             | **OK** |
| Hold certified versions                         | Epic 2–3                                               | **OK** |
| Expose tactical envelopes                       | Epic 4; envelope SoT on Library                        | **OK** |
| Gate production use to library members only     | Eligibility port; Epic 5                               | **OK** |
| Consumed by Orchestrator and Session Deployment | Integration diagram; Orchestrator deferred as consumer | **OK** |
| Expanded only through research + certification  | Immutability + new version rule                        | **OK** |

### 2.2 §8 Research Lifecycle

Spec order `Idea → Research → Validation → Strategy Library → Paper Trading → …` is adopted.

Planning explicitly rejects Paper-before-Certification as production path (Lab simulation ≠ Session Paper).

### 2.3 Adjacent modules

| Spec module               | RC-22 stance                                         | Status |
| ------------------------- | ---------------------------------------------------- | ------ |
| §5.1 Research Lab         | Evidence producer; no capital execution              | **OK** |
| §5.4 Market State         | Not built; informs future Orchestrator only          | **OK** |
| §5.5 Trading Orchestrator | Not built; Lookup/Eligibility consumer contract only | **OK** |
| §5.6 Trading Session      | Consumes Deployment binding; lifecycle SoT unchanged | **OK** |
| §5.13 Knowledge Lake      | Projection admits from Library; not membership SoT   | **OK** |

### 2.4 No Spec rewrite

Planning conforms to Spec v2.0; does not introduce new global modules beyond Strategy Library already defined.

---

## 3. Authority Matrix

| Matrix concern                 | RC-22 mapping                                                     | Status |
| ------------------------------ | ----------------------------------------------------------------- | ------ |
| Strategy algorithm SoT         | Clarified: experimental registry vs **Library certified version** | **OK** |
| Tactical config in use         | Envelope SoT on Library; Deployment may snapshot within contract  | **OK** |
| Trading Session lifecycle      | Unchanged Session SoT; Bot not a second aggregate                 | **OK** |
| Knowledge Lake contents        | Remains Projection; eligibility must not use Lake as SoT          | **OK** |
| Trading Orchestrator           | Consumer — not money/fills SoT; not built in RC-22                | **OK** |
| Risk / Orders / Fills / Ledger | Untouched                                                         | **OK** |

**Derived rule compliance:** AI cannot auto-certify; out-of-envelope tactics reject; Lake loses to Library on membership conflict.

---

## 4. Alias Dictionary

| Alias rule                         | Planning compliance                                         | Status |
| ---------------------------------- | ----------------------------------------------------------- | ------ |
| Bot = Trading Session              | Ports use `tradingSessionId` where needed; no Bot SoT       | **OK** |
| Mission = Strategy Deployment      | Deployment binds `libraryEntryId`                           | **OK** |
| Strategy = validated version       | Production path uses Library certified versions             | **OK** |
| Tactical Envelope                  | RC-19 stub → Library SoT in RC-22; enforcement in Epics 4–5 | **OK** |
| Forbidden: Bot engine / bots table | Explicit non-goals                                          | **OK** |

---

## 5. Knowledge Lake (RC-21)

| Lake rule                          | RC-22 planning                                      | Status |
| ---------------------------------- | --------------------------------------------------- | ------ |
| Append-only projection warehouse   | Library may admit certify/deprecate/archive facts   | **OK** |
| Never owns business state          | Membership/eligibility remain Library SoT           | **OK** |
| No feedback into SoT command ports | Lake → Library certification forbidden              | **OK** |
| RC-21 CLOSED / certified           | Treated as available dependency, not rebuild target | **OK** |

**Correction vs earlier draft plans:** Knowledge Lake is **not** deferred to RC-23 for this package. Sequencing reflects RC-21 closure.

---

## 6. Engineering Workflow Standard v1.0

| Requirement                                | Evidence                                             | Status |
| ------------------------------------------ | ---------------------------------------------------- | ------ |
| No implementation before plan approval     | Status PLANNING; STOP gates                          | **OK** |
| API Contract when backend ports introduced | `rc-22-api-contract.md` ports only                   | **OK** |
| Thin Epics                                 | Six epics, sequential dependencies                   | **OK** |
| Explicit non-goals / deferred RCs          | Implementation Plan §2.2                             | **OK** |
| Validation before RC close                 | Deferred to post-implementation (Validation Summary) | **OK** |

UI Contract correctly skipped (no RC-22 UI in this package).

---

## 7. Tactics Contract alignment

| Rule                                      | Planning response                  | Status |
| ----------------------------------------- | ---------------------------------- | ------ |
| Option B — pre-validated sets only        | Envelope required at certification | **OK** |
| Runtime must not invent strategy logic    | Immutability invariants            | **OK** |
| Orchestrator selects inside envelope only | Integration + non-ports            | **OK** |
| Envelope expansion = re-certification     | Domain lifecycle                   | **OK** |
| Eligibility ≠ Risk approval               | Epic 5 DoD                         | **OK** |

Note: Tactics Contract text still shows an older pipeline phrase with Paper before Certification in one diagram; **Spec §8 wins** as constitution. RC-22 adopts Spec order (documented in Implementation Plan).

---

## 8. Residual / intentional deferrals

| Item                         | Disposition                               |
| ---------------------------- | ----------------------------------------- |
| Trading Orchestrator product | Later RC — consumer ports defined only    |
| Market State Engine product  | Later — no Library write path             |
| IDE shell                    | Deferred (not RC-22)                      |
| Reporting / AI               | Later RCs                                 |
| Paper Trading redesign       | Forbidden in RC-22; gate consumption only |
| Monte Carlo engine           | Nullable evidence ref                     |
| Live capital                 | Future ADR                                |
| REST surface                 | After ports; not this planning package    |

---

## 9. Inconsistencies found and resolved in this package

| Issue                                                         | Resolution in planning package                    |
| ------------------------------------------------------------- | ------------------------------------------------- |
| Older RC-22 drafts deferred Knowledge Lake to RC-23           | Updated: RC-21 CLOSED; Lake = Projection consumer |
| Older drafts listed IDE as RC-21                              | Corrected sequencing table                        |
| Missing Domain Model + API Contract deliverables              | Added as first-class package docs                 |
| Integration diagram lacked Orchestrator / Market State / Lake | Rewritten with SoT/Projection/forbidden edges     |

No remaining blocking inconsistency against Spec v2.0.

---

## 10. Recommendation

**Approve** the RC-22 Planning Package for the next stage (Epic 1 implementation under a separate task).

Do **not** start implementation until approval checkboxes on Plan, Domain Model, and API Contract are signed.

---

## Approval

| Role               | Decision                   | Date |
| ------------------ | -------------------------- | ---- |
| Architecture owner | ☐ Concur ☐ Request changes |      |
| Tech lead          | ☐ Concur ☐ Request changes |      |
| Product owner      | ☐ Concur ☐ Request changes |      |
