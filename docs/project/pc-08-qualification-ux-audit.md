# PC-08 Qualification Product — UX Audit

**Package:** PC-08  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

**Yes** for the shipped Qualification controls. Request, confirm, cancel, record completion, record failure, and requalify hit existing Qualification ports. Confidence and health are displayed snapshots. There is no Trade now button and no score editor.

---

## Policy evidence

| Rule                                      | Evidence                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| Never expose unavailable functionality    | Confirm / complete / requalify only when the existing lifecycle allows it.    |
| Never expose disabled production buttons  | No Trade now. No live-capital qualify.                                        |
| Never expose “Coming Soon”                | Not present.                                                                  |
| Never expose placeholder pages            | `/qualification` is a working product.                                        |
| Navigation represents actual capabilities | Research → Qualification.                                                     |
| Never imply Live Trading                  | Request offers lab/paper only. `forcesTrade` / `authorizesSession` are false. |
| Research-only tools identified            | Copy states research artifact; does not force trades.                         |

## Anti-patterns avoided

| Anti-pattern                                    | Response                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Score editor that invents confidence            | Complete records lifecycle with no snapshot body. UI shows existing snapshots only. |
| Trade now on a research screen                  | Not present. Confirm is heavy-work confirm, not session start.                      |
| Relabeling research `/reports` as Qualification | Distinct `/qualification` path.                                                     |
| Profile version editor                          | Latest profile id is a ref only. Profile remains PC-09.                             |

---

**End of Qualification UX Audit.**
