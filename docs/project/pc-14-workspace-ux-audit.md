# PC-14 Workspace Management — Workspace UX Audit

**Package:** PC-14  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Workspace is a real customer product in the Operator Shell

This is not a visual redesign audit. The question is: **can the operator create, rename, archive, and switch workspaces, and does every control do the job it claims?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                         | Answer                                                                     |
| ------------------------------- | -------------------------------------------------------------------------- |
| Current workspace in the header | **Yes** — name of the persisted active workspace                           |
| Switcher list                   | **Yes** — owned Active workspaces from `GET /v1/workspaces`                |
| Switch                          | **Yes** — `GET /v1/workspaces/:id` then persist; API uses `X-Workspace-Id` |
| Create                          | **Yes** — named create dialog; `POST /v1/workspaces`                       |
| Rename                          | **Yes** — rename dialog; `PATCH /v1/workspaces/:id`                        |
| Archive                         | **Yes** — confirmation; `POST /v1/workspaces/:id/archive`                  |
| Empty / loading / error         | **Yes** — real states, not placeholders                                    |

---

## Policy rules

| Rule                                      | Result   | Evidence                                                |
| ----------------------------------------- | -------- | ------------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | No unarchive, teams, invites, or tenant admin           |
| Never expose disabled production buttons  | **PASS** | Archive and rename call existing commands               |
| Never expose “Coming Soon”                | **PASS** | Switcher contains none                                  |
| Never expose placeholder pages            | **PASS** | No empty Workspace admin route; switcher is the product |
| Hide unfinished functionality             | **PASS** | No Organization / RBAC / Exchange Scope redesign UI     |
| Navigation represents actual capabilities | **PASS** | Switcher lives in existing shell; no fake nav item      |
| Research-only tools clearly identified    | **PASS** | Unchanged PC-19 bands                                   |
| Never imply Live Trading                  | **PASS** | Workspace is context, not a live desk                   |

---

## Required UX surfaces

| Surface              | Status                                  |
| -------------------- | --------------------------------------- |
| Workspace Switcher   | Present in Operator Shell header        |
| Workspace List       | Present in the switcher panel           |
| Create dialog        | Present; name required, max 80          |
| Rename dialog        | Present; same validation                |
| Archive confirmation | Present; destructive confirm            |
| Empty state          | “No workspaces yet” + Create            |
| Validation           | Client name checks; API 400 mapped      |
| Loading              | “Loading workspaces…” / “Saving…”       |
| Error handling       | Alert in panel and dialogs; no raw JSON |
| No placeholder UI    | No Coming Soon, no fake tenant chrome   |

---

## What was not redesigned

- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands
- Workspace ownership or membership model
- Identity / login

---

**End of Workspace UX Audit.**
