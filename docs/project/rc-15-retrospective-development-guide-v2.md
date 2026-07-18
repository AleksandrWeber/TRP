# RC-15 Retrospective & Development Guide v2

Date: 2026-07-18

Status: Official

Scope: RC-15, Validation Sprint V1, and the RC-15.1 Validation Release

Related documents:

- [Project Status](./project-status.md)
- [Architecture Snapshot](./architecture-snapshot.md)
- [Roadmap](./roadmap.md)
- [Technical Debt Register](./technical-debt.md)
- [Release Process](./release-process.md)
- [Research Version History](../research/version-history.md)

---

## 1. Executive Summary

RC-15 established the Research & Simulation Platform as a coherent, deterministic foundation for future simulation work. The release introduced the Market Data, Historical Import, Market Data Provider, Backtesting, Walk-Forward, Portfolio, Trade, Performance, Strategy Comparison, and Simulation Report modules. The architecture audit then verified ownership, dependency direction, workspace isolation, immutable artifacts, and the absence of cycles among the RC-15 modules.

Validation Sprint V1 changed the confidence level of the release from “implemented and unit-tested” to “systematically validated.” VS001 confirmed functional behavior and repeated-run determinism. VS002 exercised sustained workloads up to one million bars and exposed a large-array call-stack defect. VS003 validated business and mathematical invariants and exposed an incorrect unrealized-PnL definition. VS004 reviewed architecture, debt, performance, tests, documentation, and release readiness.

RC-15.1 integrated only confirmed fixes, synchronized release documentation, restored lint and standalone typecheck gates, and published the official `rc-15.1` tag. The final repository state was clean, synchronized with `origin/main`, and green across lint, typecheck, build, and tests.

Overall assessment: RC-15 achieved its objective. The platform is suitable as the architectural foundation for RC-16, with known limitations explicitly recorded as technical debt rather than hidden in implementation assumptions.

---

## 2. RC-15 Retrospective

### 2.1 Original objectives

RC-15 aimed to create a complete simulation stack above the existing Research OS foundation:

- Introduce a workspace-scoped historical market-data model.
- Import and validate historical OHLCV data.
- Abstract market-data access behind deterministic providers.
- Execute reproducible backtests without coupling the engine to HTTP, UI, reporting, or knowledge concerns.
- Model virtual trades, portfolio state, cash, equity, and PnL.
- Calculate immutable performance reports.
- Reuse the backtest engine for walk-forward execution.
- compare strategies deterministically.
- Assemble immutable simulation reports from completed source artifacts.
- Preserve clear module ownership and acyclic dependency direction.

The release was intentionally a foundation release. Production execution realism, advanced performance analytics, configurable scoring, exporters, and large-scale streaming were not part of the RC-15 scope.

### 2.2 Major milestones completed

RC-15 progressed through the following milestones:

1. **US115 — Market Data Domain**
   - Added workspace-scoped immutable market bars and repository behavior.

2. **US116 — Historical Data Import**
   - Added validated CSV import with timestamp, OHLC, ordering, duplicate, and workspace rules.

3. **US117 — Market Data Provider Abstraction**
   - Added provider contracts and registry-based deterministic historical replay.

4. **US118 — Backtesting Engine**
   - Added sessions, strategies, execution lifecycle, processed-bar accounting, and completed run artifacts.

5. **US119 — Walk-Forward Engine**
   - Added deterministic train/test windows and aggregation through backtest-engine reuse.

6. **US120 — Portfolio Simulation**
   - Added portfolio state, snapshots, cash, equity, realized PnL, and unrealized PnL.

7. **US121 — Trade Execution Simulation**
   - Added virtual buy, sell, close, multiple-trade, and invalid-operation behavior.

8. **US122 — Performance Metrics**
   - Added immutable reports for net profit, total return, CAGR, drawdown, volatility, win rate, and profit factor.

9. **US123 — Strategy Comparison**
   - Added deterministic weighted scoring, rankings, and winner selection.

10. **US124 — Simulation Report**
    - Added immutable report assembly from backtest, portfolio, trade, performance, and related artifacts.

11. **US125 — RC-15 Architecture Audit**
    - Verified module boundaries, ownership, dependency direction, workspace isolation, and the absence of cycles among RC-15 modules.

12. **Validation Sprint V1 — VS001 through VS004**
    - Validated functionality, determinism, stress behavior, invariants, and production readiness.

13. **RC-15.1 Validation Release**
    - Integrated validated fixes, closed repository-quality gaps, synchronized documentation, and published the release.

### 2.3 Architecture evolution

RC-15 extended the Research OS with a separate simulation stack rather than expanding the existing campaign and knowledge paths.

The resulting direction is:

`Historical Import → Market Data ← Market Data Provider → Backtesting → Trade → Portfolio`

Completed run artifacts then flow to:

`Backtesting → Performance → Walk-Forward / Strategy Comparison → Simulation Report`

Important architectural outcomes:

- **Explicit module ownership.** Market data owns bars, Trade owns trade lifecycle, Portfolio owns accounting state, Performance owns derived metrics, and Simulation Report owns assembly only.
- **Acyclic dependency direction.** Performance consumes a backtest summary rather than creating a Backtesting ↔ Performance cycle.
- **Artifact-based integration.** Reporting and comparison consume completed artifacts instead of reaching into engine internals.
- **Workspace isolation.** Workspace identity is propagated through bars, requests, sessions, portfolios, and reports.
- **Immutability.** Market bars, performance reports, comparison outputs, and simulation reports are immutable after creation.
- **Deterministic boundaries.** Business outputs are derived from input data and bar/session timestamps; operational timing is treated separately.
- **No premature product coupling.** The simulation stack has no required UI, REST, persistence, production broker, or AI dependency.

### 2.4 Validation Sprint outcomes

#### VS001 — Functional Validation: PASS

VS001 validated the full pipeline twice with identical inputs and confirmed historical import, market data, provider, backtesting, trade, portfolio, performance, walk-forward, strategy comparison, and simulation-report behavior.

It detected two determinism issues:

- CAGR duration depended on wall-clock execution timestamps.
- Strategy-comparison semantic equality included operational `durationMs`.

The fixes derived CAGR duration from the equity-curve time span, anchored snapshots to session/bar timestamps, and excluded operational duration from semantic comparison.

#### VS002 — Long-running Simulation & Stress Testing: PASS

VS002 exercised:

- Small: 10,000 bars × 1 strategy.
- Medium: 100,000 bars × 5 strategies.
- Large: 1,000,000 bars × 10 strategies.

The large workload exposed `RangeError: Maximum call stack size exceeded` because snapshot summarization spread a very large array into `Math.max` and `Math.min`. Iterative peak/trough calculation fixed the defect, and a 150,000-snapshot regression test protects the behavior.

The one-million-bar workload completed but demonstrated material memory pressure, approximately 2.7 GB in the validated environment. This is recorded as TD-033 rather than being optimized during validation.

#### VS003 — Consistency & Invariant Validation: PASS

VS003 checked:

- Every trade has a corresponding portfolio effect.
- No portfolio position exists without an originating trade.
- `cash + market value of open positions = equity`.
- `realized PnL + unrealized PnL = total PnL`.
- Final total PnL equals net profit.
- Performance values are reproducible from source artifacts.
- Simulation reports mirror source artifacts rather than recalculate them.
- Walk-forward aggregation has no missing or duplicated windows.
- Strategy scores and winner selection are reproducible.
- Workspace isolation holds.
- Immutable artifacts resist mutation.

The suite detected that position market value had been mislabeled as unrealized PnL. The fix separated `computePositionMarketValue` from classic unrealized PnL and changed equity accounting to:

`equity = initialCapital + realizedPnL + unrealizedPnL`

This restored both accounting identities.

#### VS004 — Production Readiness Review: PASS WITH RECOMMENDATIONS

VS004 confirmed that RC-15 was suitable as the foundation for RC-16. Recommendations were recorded as technical debt:

- TD-028 — Execution Model: Deferred.
- TD-029 — Advanced Performance Metrics: Planned.
- TD-030 — Scoring Strategy: Deferred.
- TD-031 — Report Exporters: Future.
- TD-032 — Operational Metadata Isolation: Planned.
- TD-033 — Large Dataset Scalability: Deferred.

### 2.5 RC-15.1 Validation Release

RC-15.1 was a closeout release, not a feature release. It:

- Integrated the confirmed VS001–VS003 fixes.
- Added the validation and stress harnesses.
- Added the large-snapshot regression test.
- Restored repository lint to green.
- Restored standalone API typecheck to green.
- Synchronized project status, roadmap, changelog, version history, architecture snapshot, module maturity, and technical debt.
- Passed lint, typecheck, build, and all tests.
- Published commit `bf46b64d184d004add4f9c0316a3e33da1116718`.
- Published tag `rc-15.1`.

### 2.6 Overall assessment

RC-15 was successful because it combined incremental implementation with a dedicated validation phase. The implementation phase established modular contracts; the validation phase challenged those contracts using repeated runs, sustained workloads, and cross-module invariants.

The defects found were foundational rather than cosmetic:

- A wall-clock dependency affected a business metric.
- Operational timing affected semantic equality.
- Large-array processing failed under realistic stress.
- An accounting field had the wrong business meaning.

Finding and fixing these issues before RC-16 materially reduced architectural risk. RC-15 should therefore be considered complete, validated, and released.

---

## 3. What Worked Well

### Architecture-first development

The release defined ownership and dependency direction before adding all integrations. This prevented Backtesting from becoming a central module that knew about reporting, UI, storage, and comparison.

Benefit: smaller change surfaces, clearer tests, easier audits, and fewer accidental cycles.

### ADR-driven decisions

Existing ADR practices established a durable record of boundaries and intentional constraints. RC-15 followed the same pattern by treating architecture audits as verification of explicit rules rather than subjective code review.

Benefit: decisions remain understandable after implementation details change, and future work can distinguish intentional design from accidental behavior.

### Living documentation

Project status, roadmap, architecture snapshot, module maturity, version history, changelog, and release notes were treated as maintained system artifacts.

Benefit: release readiness could be assessed against one documented state, and stale assumptions became visible during VS004.

### Technical Debt register

Known limitations were classified rather than silently accepted or opportunistically implemented. RC-15.1 added TD-028 through TD-033 with Deferred, Planned, or Future status.

Benefit: the release remained within scope while preserving a concrete path for future improvements.

### Validation Sprint

Validation was separated from feature development and prohibited optimization unless a confirmed defect or bottleneck was found.

Benefit: validation remained evidence-driven. It exposed real correctness and scalability defects without turning into uncontrolled refactoring.

### Deterministic testing

Repeated identical runs and semantic comparisons tested the core promise of a research platform: identical inputs produce identical business outputs.

Benefit: non-determinism was detected at the business-result boundary, including subtle timing contamination that ordinary unit tests did not reveal.

### Invariant-based testing

VS003 tested relationships across modules instead of only testing individual method outputs.

Benefit: the suite detected a semantic accounting error that local tests had accepted because cash and market value happened to balance.

### Progressive stress workloads

Small, medium, and large workloads allowed the team to establish a baseline before attempting the practical limit.

Benefit: failures could be attributed to dataset scale and stage, and the million-bar call-stack defect was reproduced safely.

### Release closeout

RC-15.1 separated validated fixes, documentation synchronization, repository-quality cleanup, and official release actions from feature work.

Benefit: the released state was traceable, reproducible, clean, and explicitly approved.

---

## 4. Lessons Learned

### Business calculations must never depend on wall-clock time

Wall-clock timestamps describe execution, not market behavior. A faster or slower machine must not produce a different CAGR or other business result.

Rule: derive business duration from domain timestamps. Use wall-clock only for diagnostics and performance telemetry.

### Operational metadata must never affect business semantics

Fields such as `startedAt`, `finishedAt`, `durationMs`, UUID, and `traceId` are expected to vary.

Rule: define explicit semantic projections or result types so determinism tests do not require ad hoc field filtering.

### Accounting identities must always be validated through invariants

Correct-looking individual fields do not prove correct accounting. The original implementation balanced equity only because market value was stored under the wrong name.

Rule: validate identities at every snapshot and after every state transition, not only at final totals.

### Large datasets require dedicated stress validation

An implementation can pass all unit and medium-size tests but fail because of language/runtime limits such as argument spreading, recursion depth, or retained arrays.

Rule: include representative large workloads and stage-specific measurements before release.

### Validation should detect defects rather than optimize code

The sprint fixed the call-stack defect but did not redesign snapshot retention merely because memory usage was high.

Rule: validation may fix confirmed correctness or stability defects; broader optimization becomes planned technical debt with separate acceptance criteria.

### Immutability must include nested artifacts

Freezing only a top-level report can leave arrays or nested objects mutable.

Rule: immutable public artifacts require deep immutability tests at the boundaries consumers can access.

### Determinism is a cross-cutting property

Determinism depends on timestamp sources, ordering, tie-breaking, identifiers, metadata, and aggregation—not only the core algorithm.

Rule: every new cross-module result needs a repeated-run semantic equality test.

### Reports should assemble, not recalculate

Duplicating calculations in a report builder creates a second source of truth and eventual drift.

Rule: reports mirror completed source artifacts and only calculate report-specific summaries that have explicit ownership.

### Type and lint debt should not wait until release closeout

RC-15.1 had to resolve pre-existing repository lint and standalone typecheck failures before the release could be considered clean.

Rule: lint and typecheck are continuous gates, not final-release activities.

### Architecture reviews are most useful at decision boundaries

An architecture review after every small story would add ceremony; waiting until release closeout would be too late.

Rule: review when module ownership, dependency direction, data contracts, persistence boundaries, or more than three modules are materially affected.

### Performance observations need reproducible context

Duration, memory, and CPU numbers are meaningful only with workload shape, environment, and operational-metadata exclusions.

Rule: every baseline records dataset size, strategy count, stage, run count, and measurement conditions.

---

## 5. Development Guide v2

### 5.1 Core principles

Future releases follow these principles:

1. Architecture defines boundaries; User Stories implement bounded behavior.
2. Business semantics are deterministic for identical domain inputs.
3. Operational metadata is isolated from semantic results.
4. Cross-module correctness is protected by invariants.
5. Documentation and technical debt are updated with the work, not reconstructed at release time.
6. Validation proves behavior; it does not create features or hide failures.
7. Release gates are continuously green.
8. Commits and pushes remain explicit actions governed by the release process.

### 5.2 Process improvements for RC-16

#### Run Mini Validation every 10–15 User Stories

Mini Validation should cover the changed pipeline slice, repeated-run determinism, key invariants, and a medium representative workload.

Expected benefit: defects are found while the relevant design is still local and before multiple assumptions accumulate.

#### Run lint, typecheck, build, and tests continuously

Required cadence:

- Focused tests during each story.
- Lint and typecheck before a story is considered complete.
- Full build and test suite at each logical checkpoint.
- All gates before any release commit.

Expected benefit: repository-quality debt cannot accumulate unnoticed until closeout.

#### Maintain Technical Debt incrementally

Add or reclassify debt when a limitation is accepted, discovered, resolved, or superseded.

Every item should state:

- The concrete limitation.
- Why it is acceptable now.
- Status: Accepted, Accepted Legacy, Deferred, Planned, or Future.
- Trigger or milestone for reconsideration.

Expected benefit: scope remains controlled without losing important follow-up work.

#### Synchronize documentation continuously

Each completed story updates only the documents affected by its behavior:

- Project Status for current implementation state.
- Roadmap for milestone progress.
- Changelog for release-relevant changes.
- Version History for business-semantic changes.
- Architecture Snapshot or ADR index for boundary/decision changes.
- Module Maturity and Technical Debt when maturity or limitations change.

Expected benefit: release documentation becomes verification, not reconstruction.

#### Perform architecture reviews only at meaningful milestones

Trigger an architecture review when:

- A story crosses more than three modules.
- Dependency direction changes.
- A new persistence, execution, provider, or reporting boundary is introduced.
- A public contract changes materially.
- A release milestone completes a coherent architectural slice.

Expected benefit: architectural control remains strong without adding review ceremony to isolated implementation work.

#### Define semantic projections for deterministic results

Each result containing operational fields should expose or document a semantic projection used for equality and reproducibility checks.

Expected benefit: determinism tests become reusable and less error-prone than per-test field omission.

#### Add invariants with every accounting or aggregation change

Any change to trades, positions, cash, equity, PnL, performance, walk-forward aggregation, or scoring must add/update invariant tests.

Expected benefit: semantic regressions are detected even when individual unit outputs appear plausible.

#### Maintain a workload ladder

Keep small, medium, and large scenarios for simulation-sensitive modules. Mini Validation uses small/medium; release validation includes the practical large workload.

Expected benefit: scalability regressions are detected progressively and measured consistently.

---

## 6. Standard Development Lifecycle

### Stage 1 — Planning

Purpose: define the release or milestone outcome before implementation.

Entry criteria:

- Product/research objective is stated.
- Current project status and relevant debt are reviewed.
- Scope owner is identified.

Required activities:

- Define in-scope and out-of-scope behavior.
- Split work into independently verifiable User Stories.
- Identify business invariants and determinism requirements.
- Identify likely documentation and versioning impact.

Exit criteria:

- Milestone objective and acceptance criteria are approved.
- Story sequence is understandable.
- Known risks and dependencies are recorded.
- No unresolved ambiguity prevents architecture design.

### Stage 2 — Architecture Design

Purpose: define ownership, contracts, and dependency direction for work that changes architecture.

Entry criteria:

- Planning is complete.
- The work introduces or materially changes modules, contracts, persistence, providers, execution flow, or cross-module data.

Required activities:

- Assign module ownership.
- Draw dependency direction.
- Define immutable artifacts and workspace boundaries.
- Define semantic versus operational fields.
- Record meaningful decisions in an ADR.
- Identify invariant and stress-test needs.

Exit criteria:

- Architecture has no unexplained cycles.
- Public contracts and ownership are explicit.
- Alternatives and trade-offs are documented.
- Required ADRs are accepted.
- Stories can be implemented without reopening fundamental design.

For isolated changes that do not affect architecture, this stage may be recorded as “not required.”

### Stage 3 — User Story Implementation

Purpose: implement one bounded behavior at a time.

Entry criteria:

- Story acceptance criteria are testable.
- Required architecture decisions are available.
- Scope fits the story; otherwise, stop for review.

Required activities:

- Implement the minimum behavior required.
- Add focused unit/integration tests.
- Add determinism or invariant tests where applicable.
- Avoid unrelated refactoring and features.
- Run focused lint and typecheck checks.

Exit criteria:

- Acceptance criteria pass.
- Relevant tests pass.
- Lint and typecheck pass for affected scope.
- No unexplained behavior or hidden TODO is introduced.
- New debt is recorded.

### Stage 4 — Continuous Documentation

Purpose: keep the documented system synchronized with implementation.

Entry criteria:

- A story changes implementation state, semantics, architecture, maturity, release notes, or known limitations.

Required activities:

- Update the smallest relevant set of living documents.
- Record semantic-version impact when business calculations change.
- Update ADR references for accepted decisions.
- Update Technical Debt for accepted limitations.

Exit criteria:

- Documentation describes the implemented state.
- No “next step” or milestone statement is knowingly stale.
- Release-relevant changes appear in the changelog.
- References between canonical documents remain valid.

This stage runs alongside User Story Implementation rather than after all stories.

### Stage 5 — Mini Validation

Purpose: validate a coherent slice before release-scale complexity accumulates.

Entry criteria:

- Approximately 10–15 stories have completed, or a meaningful subsystem milestone is reached.
- Focused tests are green.

Required activities:

- Run the affected pipeline end to end.
- Repeat identical inputs and compare semantic outputs.
- Check key cross-module invariants.
- Run small and medium representative workloads.
- Record defects and practical observations without opportunistic optimization.

Exit criteria:

- Validated slice is PASS, or defects have explicit owners.
- Confirmed blockers are fixed before proceeding.
- Non-blocking findings are recorded as debt.
- Baseline results are reproducible.

### Stage 6 — Architecture Review (when required)

Purpose: verify that implementation still matches architectural intent.

Entry criteria:

- A meaningful architectural milestone is complete, or a trigger from section 5.2 occurs.

Required activities:

- Review module ownership and dependency direction.
- Check for cycles and boundary leakage.
- Verify workspace isolation and artifact immutability.
- Review public contracts, persistence boundaries, and duplicated calculations.
- Classify findings as blocker, recommendation, or debt.

Exit criteria:

- Verdict is PASS, PASS WITH RECOMMENDATIONS, or FAIL.
- FAIL blockers are resolved before release validation.
- Recommendations are assigned or registered as debt.
- Architecture documentation is synchronized.

### Stage 7 — Release Validation

Purpose: prove the complete release under functional, deterministic, invariant, and stress conditions.

Entry criteria:

- Planned stories are complete.
- Mini Validation and required architecture reviews are complete.
- Documentation is current.
- Lint, typecheck, build, and tests are green.

Required activities:

- Run functional validation of the complete release pipeline.
- Repeat identical workloads and compare semantic results.
- Validate business and mathematical invariants.
- Execute progressive stress workloads up to the practical limit.
- Review architecture, debt, performance, tests, documentation, and readiness.
- Fix only confirmed release defects.

Exit criteria:

- Validation verdicts are recorded.
- No unresolved release blocker remains.
- Performance and resource baselines are recorded.
- Confirmed defects have regression coverage.
- Remaining limitations are classified as acceptable debt.

### Stage 8 — Release Closeout

Purpose: create a reproducible official release without adding scope.

Entry criteria:

- Release Validation is approved.
- Working tree contains only approved release changes.
- Required release documentation is synchronized.

Required activities:

- Run final lint, standalone typecheck, build, and test gates.
- Abort on any failure.
- Stage approved changes.
- Create the approved release commit and tag.
- Push only on explicit authorization.
- Verify remote branch/tag synchronization and clean repository state.

Exit criteria:

- Working tree is clean.
- Release commit and tag are identifiable.
- Origin is synchronized when push was authorized.
- Release summary records gates, SHA, tag, branch, and repository state.

### Stage 9 — Retrospective

Purpose: convert release experience into improved engineering practice.

Entry criteria:

- Official release is complete.
- Validation and closeout evidence are available.

Required activities:

- Compare objectives with delivered outcomes.
- Record what worked, defects found, and lessons learned.
- Assess process and architecture risks.
- Define concrete improvements for the next release.
- Confirm next-release readiness.

Exit criteria:

- Retrospective is published as a canonical document.
- Process changes have owners or become official guidance.
- Next-release risks and priorities are explicit.
- Readiness verdict is recorded.

---

## 7. RC-16 Readiness Assessment

### Is RC-15 complete?

Yes. RC-15 implementation, US125 architecture audit, Validation Sprint V1, RC-15.1 closeout, release commit, and remote tag are complete.

### Is the platform stable?

Yes, for the validated Research & Simulation scope.

Evidence:

- Functional pipeline validation passed.
- Identical-input determinism passed after operational fields were excluded.
- Core accounting and aggregation invariants passed.
- Small, medium, and one-million-bar stress workloads completed after the snapshot-summary fix.
- Workspace isolation and artifact immutability passed.
- RC-15.1 closed with lint, typecheck, build, and tests green.

“Stable” does not mean production trading-ready. The current execution model and persistence/runtime limitations remain intentionally bounded.

### Are remaining Technical Debt items acceptable?

Yes, for entering RC-16, with conditions:

- TD-032 (Operational Metadata Isolation) should be addressed early because it affects determinism ergonomics across future features.
- TD-029 (Advanced Performance Metrics) should be planned only with explicit formulas, timestamp conventions, and reproducibility tests.
- TD-028 is now Planned for the RC-16 paper execution path under ADR-012;
  TD-030 remains deferred.
- TD-033 is acceptable while large workloads remain bounded and memory limits are documented; any growth beyond the validated workload must revisit snapshot retention.
- TD-031 remains a future product capability.
- Accepted Legacy and infrastructure debt must not be expanded accidentally.

### Primary architectural risks entering RC-16

1. **Semantic/operational mixing**
   - Future result types may continue to combine business fields with timing and identity metadata, making determinism fragile.

2. **Execution-model expansion**
   - Partial fills, intrabar logic, multiple order types, and richer fees could blur ownership between Backtesting, Trade, and Portfolio.

3. **Accounting complexity**
   - Multi-instrument or richer position models increase the number of required invariants and state transitions.

4. **Memory scaling**
   - Full per-bar snapshots scale linearly and already reached substantial memory use at one million bars.

5. **Metric-definition drift**
   - Advanced performance metrics can produce inconsistent results if annualization, risk-free rate, sampling frequency, and missing-data rules are not frozen.

6. **Scoring coupling**
   - Making strategy scoring configurable without a clear contract could mix product preferences with core performance semantics.

7. **Boundary erosion**
   - RC-16 features may be tempted to let Simulation Report or comparison logic recalculate source metrics or reach into engine internals.

### Readiness verdict

**PASS WITH RECOMMENDATIONS**

RC-15 is complete, validated, released, and suitable as the RC-16 foundation.
The required RC-16 architecture and invariant definitions are now frozen by
ADR-012…ADR-018. TD-032 is embedded in the event/runtime invariants and must be
implemented from the first result contracts.

---

## 8. Recommendations

1. Define RC-16 User Stories by milestone/epic without reopening frozen
   ownership.
2. Implement ADR-013 semantic/operational separation from the first event and
   checkpoint contracts.
3. Add ADR-018 invariant references to every affected User Story.
4. Preserve the single execution and accounting directions from ADR-012/015.
5. Run Mini Validation after milestones M2, M4, and M6.
6. Keep lint, standalone typecheck, build, and tests continuously green.
7. Update living documentation and Technical Debt with each story.
8. Require a new ADR for any architecture change after the Freeze.

---

## 9. Architecture Freeze Gate

For architecture-significant releases, Stage 2 exits through an explicit
Architecture Freeze before User Story implementation.

Freeze criteria:

- module ownership and dependency direction are accepted;
- runtime, persistence, event, accounting, recovery, and safety models are
  explicit;
- architectural invariants are immutable and testable;
- canonical planning/status/roadmap/debt/maturity documents are synchronized;
- unresolved choices that would change implementation shape are closed;
- post-Freeze architecture changes require a new ADR.

RC-16 completed this gate on 2026-07-18 through ADR-012…ADR-018.

### Frozen Architecture Audit

Large releases must complete:

```text
Planning
    ↓
Architecture Freeze
    ↓
Frozen Architecture Audit
    ↓
Implementation
```

The Audit is read-only unless it finds a blocker. It verifies ADR consistency,
dependency direction, authoritative ownership, event processing, safety, and
recovery. Implementation may begin only with a verdict of PASS or PASS WITH
MINOR RECOMMENDATIONS.

RC-16 passed its Frozen Architecture Audit on 2026-07-18 with minor
non-blocking recommendations.

---

## 10. Official Process Statement

Development Guide v2 is the standard lifecycle for future TRP releases:

**Planning → Architecture Design → Architecture Freeze (when significant) →
Frozen Architecture Audit → User Story Implementation → Continuous
Documentation → Mini Validation → Architecture Review when required → Release
Validation → Release Closeout → Retrospective**

The lifecycle is evidence-driven, deterministic, invariant-focused, and scope-controlled. A stage may be lightweight when risk is low, but its entry and exit criteria must remain satisfied.
