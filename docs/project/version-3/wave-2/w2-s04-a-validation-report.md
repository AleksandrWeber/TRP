# W2-S04-a Validation Report — Paper Account Foundation

**Status:** PASS (slice)
**Scope:** W2-S04-a only
**Date:** 2026-08-26

## Automated evidence

| Gate                                                                            | Result |
| ------------------------------------------------------------------------------- | ------ |
| Unit — Paper Account model / status / currency                                  | PASS   |
| Unit — service create / duplicate / isolation / disable-activate / audit        | PASS   |
| Integration-style — controller create / duplicate / foreign workspace / disable | PASS   |
| Isolation — no venue / Market Data transport / orders / Live Trading imports    | PASS   |
| UI — create / view Active / Disabled; no orders/positions/portfolio/PnL         | PASS   |
| `pnpm lint`                                                                     | PASS   |
| `pnpm typecheck`                                                                | PASS   |
| `pnpm test`                                                                     | PASS   |
| `pnpm --filter @trp/web build`                                                  | PASS   |
| `git diff --check`                                                              | PASS   |

## Acceptance criteria

| Criterion                                                         | Verdict |
| ----------------------------------------------------------------- | ------- |
| Workspace can create exactly one Paper Account                    | PASS    |
| Paper Account belongs only to its Workspace                       | PASS    |
| Paper Account has an initial balance                              | PASS    |
| Only approved fields exposed                                      | PASS    |
| Duplicate Paper Accounts rejected                                 | PASS    |
| Workspace Isolation enforced                                      | PASS    |
| Authorization enforced                                            | PASS    |
| No Orders / Positions / Portfolio / PnL / Matching / Live Trading | PASS    |
| Wave 1 security products unchanged                                | PASS    |

## Regression expectations

Wave 1 / W2-S01 / W2-S02 / W2-S03 smoke covered by ordinary suite at full `pnpm test` gate. This slice does not reopen those packages.

---

**STOP.** Wait for Product Owner review before W2-S04-b.
