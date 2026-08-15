# PC-09 Market Profile Product — UX Audit

**Package:** PC-09  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

**Yes** for the shipped Profile controls. Latest, versions, history, metadata, dimensions, published source, and metadata compare hit existing Market Profile query ports. Dimensions are displayed snapshots. There is no Trade now button, no score editor, and no publish command.

---

## Policy evidence

| Rule                                      | Evidence                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| Never expose unavailable functionality    | Query surfaces only. Publish stays the existing qualification pipeline.       |
| Never expose disabled production buttons  | No Trade now. No live-capital profile.                                        |
| Never expose “Coming Soon”                | Not present.                                                                  |
| Never expose placeholder pages            | `/market-profile` is a working product.                                       |
| Navigation represents actual capabilities | Research → Profile.                                                           |
| Never imply Live Trading                  | Copy states research artifact. `forcesTrade` / `authorizesSession` are false. |
| Research-only tools identified            | Copy states Profile does not calculate dimensions and does not force trades.  |

## Anti-patterns avoided

| Anti-pattern                                    | Response                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| Profile calculator that invents dimensions      | UI shows caller-supplied snapshots only. `calculatesProfile` is false. |
| Trade now on a research screen                  | Not present.                                                           |
| Relabeling research `/reports` as Profile       | Distinct `/market-profile` path.                                       |
| Publish editor on the product screen            | Publish remains PC-15 15-b.                                            |
| Dimension scoring / Market State classification | Compare is metadata only. Market State remains PC-10.                  |

---

**End of Market Profile UX Audit.**
