# W2-S01 Live Product Walkthrough Evidence

**Status:** REQUIRES ACTION — live walkthrough executed; credential storage did not complete.
**Scope:** Product Owner Close evidence only. No implementation, architecture, or ownership changes.

## Environment

| Field               | Value                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| Date                | 2026-08-17                                                             |
| Product             | Local TRP application, normal browser UI at `http://localhost:5173`    |
| Product version     | `b50a255` (`docs(connections): correct W2-S01 close evidence honesty`) |
| Operator account    | `admin@trp.local` (seeded local operator; password not recorded)       |
| Workspace           | Default Workspace                                                      |
| Connection created  | `W2-S01 Live Walkthrough Binance`                                      |
| Provider            | Exchange — Binance                                                     |
| Credential material | Synthetic non-production values; values are not recorded               |

## Evidence method

The operator used the sign-in and Connections browser UI only. No direct SQL, SSH, or manually invoked product API was used. A browser capture was reviewed during the session; no screenshot is committed because it includes credential-entry controls, even though their values were masked.

## Walkthrough record

| #   | Step                     | Verdict | Observed behavior                                                                                                                                                                                                                                                |
| --- | ------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign in successfully     | PASS    | `admin@trp.local` signed in through the normal UI and reached the authenticated Overview.                                                                                                                                                                        |
| 2   | Open Connections         | PASS    | The normal navigation opened `/connections`; the Connections screen rendered.                                                                                                                                                                                    |
| 3   | View Provider Catalog    | PASS    | The UI displayed Exchange: Binance, Bybit, OKX; Notification: Telegram, SMTP; and AI: OpenRouter.                                                                                                                                                                |
| 4   | Create a Connection      | PASS    | Created `W2-S01 Live Walkthrough Binance` in Default Workspace. The rendered row showed `EXCHANGE · BINANCE`, `Disconnected`, and `No credentials stored`.                                                                                                       |
| 5   | Store credentials        | FAIL    | The UI accepted entry into masked API Key and API Secret fields, but Save credentials returned the operator-safe alert `Please check your input.` The row remained `Disconnected` and `No credentials stored`; Vault-backed storage was therefore not evidenced. |
| 6   | Replace credentials      | FAIL    | Not executed because the initial credential-storage step failed.                                                                                                                                                                                                 |
| 7   | Run Validation           | FAIL    | Not executed because credentials were not stored. No Connected state was observed.                                                                                                                                                                               |
| 8   | Validation failure       | FAIL    | Not executed because validation was unavailable without stored credentials.                                                                                                                                                                                      |
| 9   | Disconnect               | FAIL    | Not executed because the connection never reached Connected.                                                                                                                                                                                                     |
| 10  | Disable                  | FAIL    | Not executed because the walkthrough stopped at the credential-storage blocker.                                                                                                                                                                                  |
| 11  | Revoke                   | FAIL    | Not executed because credentials were not stored.                                                                                                                                                                                                                |
| 12  | Workspace isolation      | FAIL    | Not executed because the walkthrough stopped at the credential-storage blocker.                                                                                                                                                                                  |
| 13  | Authorization without C8 | FAIL    | Not executed because the walkthrough stopped at the credential-storage blocker.                                                                                                                                                                                  |
| 14  | Secret exposure          | FAIL    | Stored-secret non-disclosure could not be confirmed because storage did not complete. The credential-entry controls were password-masked, and the error did not display entered values.                                                                          |
| 15  | Honest Product           | PASS    | The Connections UI states that Connected “does not indicate live trading, delivery, or AI execution.”                                                                                                                                                            |

## Result

The live product walkthrough was executed, but it did not pass every mandatory step. Credential storage failed with an operator-safe input error, preventing the dependent lifecycle, validation, workspace-isolation, authorization, and stored-secret checks from being completed.

W2-S01 remains **REQUIRES ACTION** for Product Owner Close Review. This document does not declare W2-S01 Closed.
