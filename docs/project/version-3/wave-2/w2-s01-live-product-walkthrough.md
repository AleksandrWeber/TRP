# W2-S01 Live Product Walkthrough Evidence

**Status:** PASS — all mandatory live walkthrough steps completed through the real product UI.
**Scope:** Product Owner Close evidence only. No implementation, architecture, or ownership changes.

## Environment

| Field           | Value                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| Date            | 2026-08-17                                                              |
| Product         | Local TRP application, normal browser UI at `http://localhost:5173`     |
| Product version | `1a04b6b` (`fix(connections): resolve validation walkthrough blocker`)  |
| Operator A      | `admin@trp.local` (Administrator; seeded local operator)                |
| Operator B      | `w2-s01-operator-b-20260817@example.test` (created via UI)              |
| Workspace A     | Default Workspace (`163bcf3b-ee70-4049-bf80-8ff79ca344ab`)              |
| Workspace B     | Operator B bootstrap workspace (`7c9cc6e9-d762-4cad-b71e-f6d2dc8d13ec`) |
| Evidence method | Real browser UI only; no direct SQL, SSH, or manually invoked APIs      |

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
| 12  | Workspace isolation             | NOT EXECUTED | Deferred to the final evidence session below.                                                                            |
| 13  | Authorization without C8        | NOT EXECUTED | Deferred to the final evidence session below.                                                                            |
| 14  | Secret exposure                 | PASS         | Stored values were password-masked at entry, never shown after save, and views exposed only the stored/not-stored state. |
| 15  | Honest Product                  | PASS         | Connections states that Connected does not indicate live trading, delivery, or AI execution.                             |

## Final evidence session — remaining steps

### Walkthrough A — Workspace Isolation

| Field       | Value                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Operator A  | `admin@trp.local` in Workspace A (Default Workspace)                                                  |
| Operator B  | `w2-s01-operator-b-20260817@example.test` in Workspace B                                              |
| Workspace A | Default Workspace — connections `W2-S01 Live Walkthrough Binance`, `W2-S01 Disable Walkthrough Bybit` |
| Workspace B | Operator B workspace — connection `W2-S01 Isolation B Connection`                                     |
| Verdict     | PASS                                                                                                  |

Observed result:

1. As Operator B (Researcher, then Trader), Connections listed only Workspace B content. Operator A’s connections were not visible.
2. As Operator B, Create of a foreign Workspace A connection was not available through the UI because Workspace A connections were not listed and Workspace A was not selectable as a foreign member workspace.
3. As Operator B (Trader), created `W2-S01 Isolation B Connection` in Workspace B.
4. As Operator A, Connections listed only Workspace A rows (`W2-S01 Live Walkthrough Binance`, `W2-S01 Disable Walkthrough Bybit`) and did **not** show `W2-S01 Isolation B Connection`.
5. Because Workspace B connections were not visible to Operator A, validate, replace credentials, disconnect, disable, and revoke for Workspace B connections could not be initiated through the real UI.

### Walkthrough B — Authorization (non-C8)

| Field     | Value                                                             |
| --------- | ----------------------------------------------------------------- |
| Operator  | `w2-s01-operator-b-20260817@example.test` while role = Researcher |
| C8 status | Researcher lacks VaultConnections (C8)                            |
| Verdict   | PASS                                                              |

Observed result:

1. While signed in as Researcher, Connections showed create controls, but Create metadata for `Unauthorized Create Attempt` returned the operator-safe alert `You do not have permission to perform this action.` API logged HTTP 403 on `POST /v1/connections`.
2. No connection metadata was created under that denial (`No connection metadata has been created.` remained).
3. Store credentials, Replace credentials, Validate, Disconnect, Disable, and Revoke were unavailable through the UI because no connection row existed to act on after Create was denied.

## Validation HTTP 400 root cause (prior remediation)

The Connections browser client sent bodyless `POST` commands with `Content-Type: application/json`. Fastify rejects an empty JSON request before the controller receives it, producing HTTP 400. The remediation sends `{}` for bodyless Connection validate, disconnect, disable, and revoke commands.

## Result

The live product walkthrough is complete. Lifecycle, secret non-disclosure, honest Connected copy, workspace isolation, and non-C8 authorization evidence are all recorded as PASS. W2-S01 is ready for Product Owner Close Review. This document does not declare W2-S01 Closed.
