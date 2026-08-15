# PC-12 Exchange Scope Product — UX Audit

**Package:** PC-12  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

**Yes** for the shipped Cluster controls. Create, rename, activate, suspend, archive, config, policy inputs, and bindings hit existing Exchange Scope ports. Venue list is isolation catalog, not live connect.

---

## Policy evidence

| Rule                                      | Evidence                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Never expose unavailable functionality    | Lifecycle buttons only when the existing transition is allowed. Archived scopes cannot rename or publish config.                                        |
| Never expose disabled production buttons  | No Connect/Disconnect live venue controls.                                                                                                              |
| Never expose “Coming Soon”                | Not present.                                                                                                                                            |
| Never expose placeholder pages            | `/clusters` is a working product. `/trading/exchanges` stays redirected.                                                                                |
| Navigation represents actual capabilities | Paper trading → Cluster.                                                                                                                                |
| Never imply Live Trading                  | Create offers lab/paper only. `liveVenueAdapter` / `venueApiUsed` / `liveCapital` are false. Mode `live` is labeled as label-only when already present. |
| Cluster alias                             | UI says Cluster; owner remains Exchange Scope.                                                                                                          |

## Anti-patterns avoided

| Anti-pattern                                               | Response                                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Venue picker that looks live while I/O is stubbed          | Catalog states venues are not live adapters and do not call exchange APIs. |
| Relabeling `/trading/exchanges` adapter connect as Cluster | Adapter page stays unwired. Cluster is a new product path.                 |
| Policy editor that looks like a Risk engine                | Copy states policy values are inputs, not risk decisions.                  |

---

**End of Exchange Scope UX Audit.**
