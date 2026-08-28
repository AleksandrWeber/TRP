# Operational State Matrix — Wave 3 Operational Continuity

**Document:** Permanent Wave 3 reference for Operational Continuity behaviour  
**Authority:** Product Owner · Version 3 · W3-O01-d  
**Date:** 2026-08-26  
**Scope:** Normal process restart only. Not Business Continuity, HA, Disaster Recovery, Monitoring, or failover.  
**Recovery:** Uses W3-O01-c restart recovery only. Continuity begins after successful recovery evaluation.

Supported operational states **only:** `Recovering` | `Ready` | `Degraded` | `Unavailable`.

Platform readiness is **derived solely from owner readiness**. No hardcoded global platform state.

---

## Durable analytical owners (SURVIVE / recovery required)

| Owner                                            | Recovery Required | Operational State                                                      | Customer Visible Behaviour                                                                                                                                   | Platform Behaviour                                                        | Operator Action Required                                               | Dependency Owners                                    | Allowed Degraded Behaviour                                                                                      |
| ------------------------------------------------ | ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| strategy-library                                 | Yes               | Recovering → Ready \| Unavailable; Degraded if deps Unavailable (none) | Library reads available when Ready; refuse fabricated membership/certification when Unavailable                                                              | Continues for Ready owners; isolates Unavailable                          | Investigate hydrate/corrupt snapshot if Unavailable; restart after fix | _(none)_                                             | Independent Ready owners keep serving. Never invent library entries.                                            |
| exchange-scope                                   | Yes               | Recovering → Ready \| Unavailable                                      | Scope reads available when Ready; Unavailable refuses fabricated scopes                                                                                      | Isolates Unavailable; dependents may Degrade                              | Investigate snapshot if Unavailable                                    | _(none)_                                             | Dependents Degraded only. No fabricated scopes.                                                                 |
| knowledge-lake                                   | Yes               | Recovering → Ready \| Unavailable                                      | Lake analytical reads when Ready; Unavailable refuses fabricated facts                                                                                       | Isolates Unavailable; reporting may Degrade                               | Investigate snapshot if Unavailable                                    | _(none)_                                             | Reporting Degraded. No fabricated lake facts.                                                                   |
| market-profile                                   | Yes               | Recovering → Ready \| Unavailable                                      | Profile reads when Ready; Unavailable refuses fabricated profiles                                                                                            | Isolates Unavailable; dependents may Degrade                              | Investigate snapshot if Unavailable                                    | _(none)_                                             | Qualification/state Degraded if dependent. No fabricated profiles.                                              |
| market-qualification                             | Yes               | Recovering → Ready \| Unavailable \| Degraded                          | Qualification when Ready; Degraded when deps Unavailable; Unavailable on own init failure                                                                    | Dependent of exchange-scope + market-profile                              | Fix Unavailable deps or own snapshot                                   | exchange-scope, market-profile                       | Serve only safe local state when Degraded; never invent qualifications.                                         |
| market-state                                     | Yes               | Recovering → Ready \| Unavailable \| Degraded                          | State reads when Ready; Degraded when deps Unavailable                                                                                                       | Dependent of market-qualification, market-profile, exchange-scope         | Fix deps or snapshot                                                   | market-qualification, market-profile, exchange-scope | Honest empty/partial reads only; never invent states.                                                           |
| reporting                                        | Yes               | Recovering → Ready \| Unavailable \| Degraded                          | Report definitions/runs when Ready; Degraded if knowledge-lake Unavailable                                                                                   | Dependent of knowledge-lake                                               | Fix lake or reporting snapshot                                         | knowledge-lake                                       | Query may refuse lake-backed generation; never fabricate report artifacts.                                      |
| notification-delivery                            | Yes               | Recovering → Ready \| Unavailable \| Degraded                          | Notification analytical surfaces + durable queue continuity when Ready; Degraded on channel-down / abandoned honesty; Unavailable on corrupt/failed recovery | Independent of other durable analytical owners for continuity             | Investigate snapshot / channel honesty if Unavailable or Degraded      | _(none)_                                             | Continues when other owners Unavailable. Queue continuity is W3-O02-d (derived; no retry execution).            |
| trading-session (Kill Switch)                    | Yes               | Recovering → Ready \| Unavailable \| Degraded                          | Kill Switch operational readiness on Platform Readiness when Ready; Degraded on integrity failure; Unavailable on corrupt/failed recovery                    | Independent of durable analytical owners for Kill Switch continuity       | Investigate persistence / hydrate if Unavailable or Degraded           | _(none)_                                             | Continues when other owners Unavailable. Kill Switch continuity is W3-O04-d (derived; no execution).            |
| security-platform (Monitoring & Security Health) | Yes               | Recovering → Ready \| Unavailable \| Degraded                          | Monitoring & Security Health operational readiness on Platform Readiness when Ready; Degraded on integrity failure; Unavailable on corrupt/failed recovery   | Independent of durable analytical owners for monitoring health continuity | Investigate persistence / hydrate if Unavailable or Degraded           | _(none)_                                             | Continues when other owners Unavailable. Monitoring continuity is W3-O05-d (derived; no evaluation/dashboards). |
| trading-orchestrator                             | Yes               | Recovering → Ready \| Unavailable \| Degraded                          | Orchestration coordination when Ready; Degraded if deps Unavailable                                                                                          | Depends on strategy-library, exchange-scope, market-state                 | Fix deps or snapshot                                                   | strategy-library, exchange-scope, market-state       | Refuse unsafe coordination; never invent plans/runs.                                                            |
| runtime-enforcement                              | Yes               | Recovering → Ready \| Unavailable \| Degraded                          | Runtime validation history when Ready; Degraded if strategy-library Unavailable                                                                              | Depends on strategy-library                                               | Fix library or snapshot                                                | strategy-library                                     | Validation history empty/honest deny; never invent validations.                                                 |

---

## EPHEMERAL analytical owners (no restart recovery)

| Owner                                                    | Recovery Required | Operational State                         | Customer Visible Behaviour                                      | Platform Behaviour                                       | Operator Action Required                             | Dependency Owners | Allowed Degraded Behaviour                                     |
| -------------------------------------------------------- | ----------------- | ----------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- | ----------------- | -------------------------------------------------------------- |
| ai-analytics (analytical narrative / ephemeral surfaces) | No                | Not projected as SURVIVE continuity owner | EPHEMERAL honesty: may not survive restart (inventory baseline) | Not restored by W3-O01-c; not claimed Ready via recovery | Accept ephemeral honesty; no continuity repair claim | _(inventory)_     | Must not claim durable recovery. Never fabricate SURVIVE data. |

---

## Platform projection rules

| Condition                                                   | Platform State |
| ----------------------------------------------------------- | -------------- |
| Any owner still Recovering                                  | Recovering     |
| All durable owners Unavailable                              | Unavailable    |
| Any owner Unavailable or Degraded (and not all Unavailable) | Degraded       |
| All durable owners Ready                                    | Ready          |

---

## Hard rules

1. Unavailable owners **never fabricate** analytical data.
2. Healthy / Ready owners **continue operating** when dependencies allow.
3. Failures remain **isolated** to the unavailable owner and documented dependents.
4. Degraded behaviour is **only** what this matrix allows — never silent disable without status.
5. Operators see readiness via `/operational-continuity` (API `GET /v1/operational-continuity/readiness`) — **not** monitoring dashboards, incident management, cluster, or replication UI.

---

## Explicit non-claims

This matrix does **not** authorize Monitoring evaluation, dashboards, alerting, Business Continuity, High Availability, Disaster Recovery, failover, or infrastructure orchestration. W3-O05-d adds **operational continuity projection only** — not Monitoring Complete.
