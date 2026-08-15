# PC-12 Exchange Scope Product — Scope Matrix

**Package:** PC-12  
**Date:** 2026-08-15

| Operator job           | Existing owner capability                  | Product exposure                 | Offered                     |
| ---------------------- | ------------------------------------------ | -------------------------------- | --------------------------- |
| Workspace scopes       | `listExchangeScopes` / workspace aggregate | Home + `GET /workspace`          | Yes                         |
| Exchange list          | Known venue codes                          | Home catalog + `GET /venues`     | Yes (not live adapters)     |
| Create Scope           | `registerExchangeScope`                    | Create form + `POST /`           | Yes (lab/paper)             |
| Rename Scope           | config publish `displayName`               | Rename + `POST /:id/rename`      | Yes (not archived)          |
| Activate               | `activateExchangeScope`                    | Lifecycle + `POST /:id/activate` | Yes when transition allowed |
| Suspend                | `suspendExchangeScope`                     | Lifecycle + `POST /:id/suspend`  | Yes when transition allowed |
| Archive                | `archiveExchangeScope`                     | Lifecycle + `POST /:id/archive`  | Yes when transition allowed |
| Policy inputs          | `publishExchangeRiskPolicy` / query        | Policies tab                     | Yes (not a Risk decision)   |
| Bindings               | bind / unbind / adapter context            | Bindings tab                     | Yes (no venue API)          |
| Configuration versions | history on the store                       | Versions tab                     | Yes                         |
| Metadata               | consumer metadata projection               | Metadata tab                     | Yes                         |
| History                | versions + lifecycle + policy + bindings   | History tab                      | Yes                         |
| Current active scope   | active lifecycle + workspace aggregate     | Home current-active              | Yes                         |
| Live venue connect     | Not an Exchange Scope capability           | Hidden                           | No                          |
| Exchange APIs          | Forbidden                                  | Hidden                           | No                          |

---

**End of Scope Matrix.**
