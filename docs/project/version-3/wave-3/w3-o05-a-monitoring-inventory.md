# W3-O05-a Monitoring & Security Health Inventory & Honest Baseline

**Slice:** W3-O05-a — Inventory & Monitoring Baseline  
**Package:** W3-O05 Monitoring & Security Health (V3-O05 · MN-02 · MN-03 · SEC-13 · SEC-15)  
**Wave:** 3 — Durability, Operations & Continuity  
**Date:** 2026-08-28  
**Nature:** Discovery and classification only. Not monitoring implementation. Not health evaluation. Not alerting. Not dashboards. Not persistence. Not restart recovery. Not operational continuity.  
**Machine inventory:** `apps/api/src/platform-conformance/w3-o05-a-monitoring-inventory.ts`

```text
This inventory does NOT implement monitoring.
This inventory does NOT implement security health evaluation.
This inventory does NOT implement alerting or dashboards.
This inventory does NOT implement persistence or restart recovery.
This inventory does NOT declare Monitoring Complete.
This inventory does NOT declare W3-O05 CLOSED.
This inventory does NOT declare Wave 3 COMPLETE.
Customer-visible monitoring product remains FALSE until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every monitoring-related, security health, runtime health, operational health, projection, dependency, ownership, and honesty boundary artifact in Version 2. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification. Freeze the canonical planning baseline for W3-O05-b…e.

| Class         | Meaning                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate target on existing Security Platform / Audit / Continuity owners. |
| **EPHEMERAL** | Transient, computed, stub, UI-only, process-local, or missing — must not be treated as durable monitoring truth on paper.        |

---

## Binding finding

**Monitoring & Security Health product is NOT Complete. Monitoring does NOT survive restart from this slice.**

- `GET /health` (MN-01) exists — process probe only, not operator monitoring dashboard.
- Prometheus `/v1/metrics` exists — ops scrape, not MN-02 Observability product Complete.
- Platform Readiness UI exists — post-restart continuity, not ongoing Monitoring Complete.
- Connection health projection exists in API — no unified operator dashboard.
- Security audit store **SURVIVE** — timeline API exists; no operator web UI.
- SEC-15 Security Health dashboard **missing** (0% readiness).
- Operator incident visibility UI **missing**.
- Durable monitoring health state **not implemented** (W3-O05-b target).

---

## Inventory summary by kind

| Kind                  | Count | Notes                                               |
| --------------------- | ----- | --------------------------------------------------- |
| command               | 5     | Health read surfaces                                |
| state                 | 8     | Durable audit/continuity + ephemeral runtime        |
| projection            | 6     | Connection/queue/Kill Switch/readiness + gaps       |
| runtime               | 7     | Health eval, security bootstrap, metrics            |
| operational           | 4     | Capability inventory, planning, state matrix        |
| operator-visible      | 5     | Readiness page exists; dashboards missing           |
| persistence-candidate | 2     | Audit store exists; monitoring persistence missing  |
| ephemeral-artifact    | 2     | In-memory derivations                               |
| dependency            | 9     | consumes/produces/depends-on/observed-by/blocked-by |
| ownership             | 4     | Verified — no movement                              |
| honesty-boundary      | 10    | Binding non-claims                                  |
| explicit-out          | 6     | Second platform, Live, BC/HA/DR, domain health      |

Full row detail: machine inventory `W3_O05_A_MONITORING_INVENTORY` and helper exports `rowsSurvive()`, `rowsEphemeral()`, `rowsMonitoringSurvive()`, `rowsSecurityHealthSurvive()`.

---

## Monitoring SURVIVE artifacts (summary)

| Artifact ID                              | Owner                  | Justification                           |
| ---------------------------------------- | ---------------------- | --------------------------------------- |
| `cmd-get-security-audit-timeline`        | security-audit         | Reads durable audit store               |
| `state-queue-continuity-status`          | notification-delivery  | W3-O02-c persisted recovery record      |
| `state-kill-switch-continuity-status`    | trading-session        | W3-O04-c persisted recovery record      |
| `state-analytical-owner-continuity`      | operational-continuity | W3-O01-d boot outcome registry          |
| `runtime-startup-verification`           | runtime-platform       | Production bootstrap gate (code/config) |
| `runtime-security-platform-bootstrap`    | security-platform      | Wave 1 security config verification     |
| `runtime-security-audit-emitter`         | security-audit         | Persists audit records                  |
| `op-operational-state-matrix`            | wave-3-documentation   | Continuity reference documentation      |
| `ui-operational-continuity-page`         | operational-continuity | Routed paper product UI                 |
| `persist-security-audit-store`           | security-audit         | Existing authoritative audit SoT        |
| `dep-consumes-authentication`            | authentication         | Wave 1 consumed                         |
| `dep-consumes-authorization`             | authorization          | Wave 1 consumed                         |
| `dep-consumes-workspace-isolation`       | workspace-isolation    | Wave 1 consumed                         |
| `dep-depends-on-w3-o01-o04-continuity`   | operational-continuity | CLOSED predecessor substrates           |
| `own-*` (4 rows)                         | substrate owners       | Verified existing ownership             |
| `adjacent-w3-o04-kill-switch-foundation` | kill-switch-deferred   | CLOSED predecessor input                |

## Monitoring EPHEMERAL artifacts (summary)

| Artifact ID                                       | Owner                  | Justification                                |
| ------------------------------------------------- | ---------------------- | -------------------------------------------- |
| `cmd-get-runtime-health`                          | runtime-platform       | Computed per request                         |
| `cmd-get-operational-readiness`                   | operational-continuity | Bootstrap projection, not ongoing monitoring |
| `cmd-get-prometheus-metrics`                      | runtime-platform       | In-process metrics reset on restart          |
| `cmd-get-live-health`                             | live-trading-deferred  | Live-only; out of paper scope                |
| `state-runtime-health-report`                     | runtime-platform       | Transient aggregation                        |
| `state-prometheus-instruments`                    | runtime-platform       | Process-local counters                       |
| `proj-*` (connection/queue/kill-switch/platform)  | various                | Computed projections                         |
| `proj-unified-monitoring-dashboard`               | command-center         | **Missing**                                  |
| `runtime-*` (health service, metrics, continuity) | various                | In-process evaluation                        |
| `ui-web-runtime-health-client`                    | command-center         | Client without dashboard surface             |
| `ui-connection-health-dashboard`                  | connection-management  | **Missing**                                  |
| `eph-*`                                           | various                | In-memory only                               |
| `dep-produces-health-projections`                 | operational-continuity | Bootstrap outputs                            |
| `dep-observed-by-platform-readiness-ui`           | operational-continuity | Readiness observer only                      |

## Security Health SURVIVE artifacts (summary)

| Artifact ID                           | Owner             | Justification                   |
| ------------------------------------- | ----------------- | ------------------------------- |
| `state-security-audit-records`        | security-audit    | Durable audit trail             |
| `state-security-incident-records`     | security-audit    | Durable incident store          |
| `runtime-security-platform-bootstrap` | security-platform | Startup verification substrate  |
| `runtime-security-audit-emitter`      | security-audit    | Persists security events        |
| `persist-security-audit-store`        | security-audit    | Authoritative audit persistence |
| `own-security-platform-substrate`     | security-platform | Verified owner                  |
| `own-security-audit-incident`         | security-audit    | Verified owner                  |

## Security Health EPHEMERAL artifacts (summary)

| Artifact ID                                 | Owner             | Justification                         |
| ------------------------------------------- | ----------------- | ------------------------------------- |
| `state-security-health-dashboard`           | security-platform | **Missing** — 0% SEC-15 readiness     |
| `runtime-platform-abuse-protection`         | security-platform | In-process counters                   |
| `ui-security-health-dashboard`              | security-platform | **Missing** operator UI               |
| `ui-security-incident-visibility`           | security-audit    | **Missing** operator UI               |
| `persist-monitoring-health-state`           | security-platform | **Not implemented** — W3-O05-b target |
| `dep-blocked-by-missing-security-dashboard` | security-platform | Active blocker                        |
| `dep-blocked-by-missing-incident-ui`        | security-audit    | Active blocker                        |

---

## Honesty boundaries (binding)

| Artifact ID                                     | Boundary                                  |
| ----------------------------------------------- | ----------------------------------------- |
| `honesty-monitoring-not-platform`               | Monitoring ≠ Monitoring Platform          |
| `honesty-monitoring-not-observability-platform` | Monitoring ≠ Observability Platform       |
| `honesty-monitoring-not-siem-soc`               | Monitoring ≠ SIEM; Monitoring ≠ SOC       |
| `honesty-monitoring-not-incident-management`    | Monitoring ≠ Incident Management          |
| `honesty-monitoring-not-bc-ha-dr`               | Monitoring ≠ BC / HA / DR                 |
| `honesty-monitoring-not-live-trading`           | Monitoring ≠ Live Trading                 |
| `honesty-monitoring-not-wave3-complete`         | Monitoring ≠ Wave 3 COMPLETE              |
| `honesty-security-health-not-security-platform` | Security Health ≠ Security Platform owner |
| `honesty-security-health-not-secops`            | Security Health ≠ Security Operations     |
| `honesty-readiness-not-monitoring`              | Platform Readiness ≠ Monitoring Complete  |

---

## Mandatory Questions

1. **What customer-visible functionality was delivered?** None.

2. **Which Monitoring artifacts require SURVIVE classification?** Documented above and in `rowsMonitoringSurvive()`.

3. **Which Monitoring artifacts are EPHEMERAL?** Documented above and in `rowsMonitoringEphemeral()`.

4. **Which Security Health artifacts require SURVIVE classification?** Documented above and in `rowsSecurityHealthSurvive()`.

5. **Which Security Health artifacts are EPHEMERAL?** Documented above and in `rowsSecurityHealthEphemeral()`.

6. **Were ownership boundaries verified?** Yes.

7. **Were any new persistence owners introduced?** No.

8. **Were any ownership boundaries changed?** No.

9. **Were any architectural deviations introduced?** No.

10. **Can monitoring survive restart after this slice?** No.

---

**STOP.** Wait for Product Owner review before W3-O05-b.
