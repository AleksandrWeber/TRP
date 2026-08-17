# V3-S06-a Validation Report

**Package:** V3-S06 Workspace Isolation Hardening
**Slice:** S06-a — Workspace Isolation Foundation
**Status:** PASS — validation completed 2026-08-17. Product Owner review is
required before S06-b.

## Required validation

| Command / gate                                    | Result                                                 |
| ------------------------------------------------- | ------------------------------------------------------ |
| Focused S06-a isolation harness tests             | **PASS** — 9 tests (matrix contract + negative proofs) |
| `pnpm lint`                                       | **PASS**                                               |
| `pnpm typecheck`                                  | **PASS**                                               |
| `pnpm test`                                       | **PASS** (prior full run)                              |
| `pnpm --filter @trp/web build`                    | **PASS** — existing chunk-size warning only            |
| `git diff --check`                                | **PASS**                                               |
| Security Regression Suite (S06-a negative proofs) | **PASS** — `workspace-isolation/` Vitest suite         |

## Evidence exercised by the focused suite

| Proof                                           | Evidence types                |
| ----------------------------------------------- | ----------------------------- |
| Workspace A substitutes Workspace B id → denied | Static · Runtime · Regression |
| Reader / foreign Trader Vault access → denied   | Static · Runtime · Regression |
| Session B resolved as A → denied                | Runtime · Regression          |
| Trader A opens Timeline B → denied before read  | Static · Runtime · Regression |
| Incident A links Audit evidence B → denied      | Runtime · Regression          |

## Mandatory answers

1. **Which products are now isolation-proved?** Foundation scenarios across
   Workspace, Session, Vault, Timeline transport, and Incident evidence;
   full S06 Close proof remains pending.
2. **Which products are NOT yet isolation-proved?** Remaining matrix rows
   scheduled for S06-b through S06-e.
3. **Which negative proofs were added?** Workspace id, Vault, session,
   Timeline, and Incident/Audit foreign-access denials.
4. **Which evidence types exist?** Static, Runtime, and Regression.
5. **Was the Master Plan respected?** Yes.
6. **Were Product Principles respected?** Yes.
7. **Were any architectural deviations introduced?** No.

## Exit status

S06-a does **not** claim S06 Close, Wave 1 Exit, or Wave 1 COMPLETE.

**STOP.** Run validation, record results, then wait for Product Owner review
before S06-b.
