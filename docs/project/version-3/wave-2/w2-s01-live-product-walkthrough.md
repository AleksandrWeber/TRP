# W2-S01 Live Product Walkthrough Evidence

**Status:** REQUIRES ACTION — the repeated live walkthrough passed Connection Management flows but did not execute the separate workspace-isolation and unauthorized-role sessions.
**Scope:** Product Owner Close evidence and targeted validation-remediation record only. No architecture or ownership changes.

## Environment

| Field               | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Date                | 2026-08-17                                                          |
| Product             | Local TRP application, normal browser UI at `http://localhost:5173` |
| Product version     | `0cf7704` plus the validation-remediation working tree              |
| Operator account    | `admin@trp.local` (seeded local operator; password not recorded)    |
| Workspace           | Default Workspace                                                   |
| Connection created  | `W2-S01 Live Walkthrough Binance`                                   |
| Provider            | Exchange — Binance                                                  |
| Credential material | Synthetic non-production values; values are not recorded            |

## Evidence method

The operator used the sign-in and Connections browser UI only. No direct SQL, SSH, or manually invoked product API was used. A browser capture was reviewed during the session; no screenshot is committed because it includes credential-entry controls, even though their values were masked.

## Initial walkthrough

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

The initial run stopped at credential storage because the local API host configuration did not provide the required Vault wrapping key. The key was configured locally; no tracked application change was needed for Credential Save.

## Repeated walkthrough after Validation remediation

| #   | Step                            | Verdict      | Observed behavior                                                                                                        |
| --- | ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Sign in successfully            | PASS         | The seeded operator session remained authenticated in the normal UI.                                                     |
| 2   | Open Connections                | PASS         | The Connections UI loaded from normal navigation.                                                                        |
| 3   | View Provider Catalog           | PASS         | Exchange (Binance, Bybit, OKX), Notification (Telegram, SMTP), and AI (OpenRouter) were rendered.                        |
| 4   | Create metadata                 | PASS         | Created a separate Bybit metadata entry to exercise Disable without affecting the primary connection.                    |
| 5   | Store credentials               | PASS         | Synthetic non-production credentials were accepted; the UI showed only `Credentials stored securely.`                    |
| 6   | Replace credentials             | PASS         | Replacement completed and retained `Disconnected`.                                                                       |
| 7   | Run Validation                  | PASS         | UI showed `Pending Validation`, then `Connected`; no provider network claim was displayed.                               |
| 8   | Validation failure or Connected | PASS         | The approved deterministic-success branch reached `Connected`.                                                           |
| 9   | Disconnect                      | PASS         | The primary connection returned to `Disconnected`.                                                                       |
| 10  | Disable                         | PASS         | The separate Bybit entry showed `Disabled`; its validate and credential actions were absent.                             |
| 11  | Revoke                          | PASS         | The primary connection showed `Revoked`, `No credentials stored`, and only `Store credentials` for material recovery.    |
| 12  | Workspace isolation             | NOT EXECUTED | A separate non-member Workspace B operator session was not executed in this remediation.                                 |
| 13  | Authorization without C8        | NOT EXECUTED | A separate non-C8 role session was not executed in this remediation.                                                     |
| 14  | Secret exposure                 | PASS         | Stored values were password-masked at entry, never shown after save, and views exposed only the stored/not-stored state. |
| 15  | Honest Product                  | PASS         | Connections states that Connected does not indicate live trading, delivery, or AI execution.                             |

## Validation HTTP 400 root cause

The Connections browser client sent bodyless `POST` commands with `Content-Type: application/json`. Fastify rejects an empty JSON request before the controller receives it, producing HTTP 400. The remediation sends `{}` for bodyless Connection validate, disconnect, disable, and revoke commands. A browser retest confirmed Validation reached `Pending Validation` then `Connected`.

## Result

The repeated real-product flow passed all exercised Connection Management lifecycle steps. W2-S01 remains **REQUIRES ACTION** for Product Owner Close Review until the two separate-role sessions (workspace isolation and non-C8 authorization denial) are recorded. This document does not declare W2-S01 Closed.
