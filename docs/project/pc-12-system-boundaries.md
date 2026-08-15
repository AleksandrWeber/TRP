# PC-12 Exchange Scope Product — System Boundaries

**Package:** PC-12  
**Date:** 2026-08-15  
**Verdict:** Boundaries held.

---

## Exchange Scope

Exchange Scope remains the isolation owner. Product views compose existing service, query, and consumer-read ports. They do not add venues, persist a database product, or become Runtime / Session / Deployment.

The Exchange Scope bounded context still does not import the product adapter, Runtime, Trading Session, or Deployment. Domain `rest: false` is unchanged. HTTP lives in sibling `exchange-scope-product`.

## Runtime, Session, Deployment

Unchanged. Cluster does not start sessions, approve deployments, or authorize Runtime.

## Venue adapters

Not created. Known venue codes are isolation labels. Adapter binding context remains a logical record, not a wire protocol.

## Distinct surfaces

Command Center default-scope overview remains `GET /v1/exchange-scopes/default`. Adapter Exchanges remain unwired. Cluster product paths are `/v1/exchange-scopes/*` (except `default`) and `/clusters`.

---

**End of System Boundaries.**
