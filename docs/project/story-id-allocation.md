# Story ID Allocation

Date: 2026-08-01

Status: Authoritative for new User Story IDs

Purpose: Prevent collisions across releases and make RC-17/RC-18 numbering
unambiguous.

Related:

- [Release History](./release-history.md)
- [RC-17 Roadmap](./rc-17-roadmap.md)
- [RC-17 Release Planning](./rc-17-release-planning.md)
- [RC-16 M3 Strategy Runtime Plan](./rc-16-m3-strategy-runtime-plan.md) (historical)

---

## Official RC-17 Story ID allocation

| Release   | Official range  | Status                                                            |
| --------- | --------------- | ----------------------------------------------------------------- |
| **RC-17** | **US240–US299** | **Allocated — E17 Done; RC-18 residuals US290–US295 in progress** |

All new RC-17 User Stories **MUST** use IDs in **US240–US299**.

Epic ownership for RC-17 (authoritative):

| Epic                         | Name                    | Tentative stories (planning) |
| ---------------------------- | ----------------------- | ---------------------------- |
| E17                          | Runtime Recovery        | US240–US249                  |
| E18                          | Event Processing        | US250–US259                  |
| E19                          | Operations              | US260–US269                  |
| E20                          | Market Data             | US270–US279                  |
| E21                          | Multi-Strategy Platform | US280–US289                  |
| Reserve / spill / validation | RC-17 closeout & splits | US290–US299                  |

Exact story titles are assigned in Stage 1 Epic Planning. Sub-bands above are
guidance; the hard rule is the full **US240–US299** envelope.

---

## Reserved ranges (do not reuse)

| Range           | Owner / meaning                                           | Rule                                                                                                  |
| --------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| US001–US125     | Research OS / Simulation (through RC-15)                  | Historical — closed                                                                                   |
| US126–US183     | RC-16 M1–M2                                               | Historical — closed                                                                                   |
| US183.1         | Cluster closure (docs/validation)                         | Historical — closed                                                                                   |
| US184–US210     | Trading Platform V1 / research runner parallel band       | **Do not reuse** for RC-16/RC-17 paper runtime                                                        |
| US211–US223     | RC-16 M3 (E13–E16) — implemented                          | Historical — closed                                                                                   |
| US224–US227     | Originally sketched as RC-16 M3 “Epic E17” recovery hooks | **Transferred to RC-17.** Do **not** implement under these IDs. Intent absorbed by RC-17 E17 (US240+) |
| US228–US235     | RC-16 M3 optional split reserve (unused)                  | **Retired / unused.** Do not assign without updating this document                                    |
| US236–US239     | Buffer between RC-16 M3 reserve and RC-17                 | **Reserved empty** — do not use without governance update                                             |
| **US240–US299** | **RC-17**                                                 | **Active allocation**                                                                                 |
| US300+          | Future releases                                           | Unallocated until a later release claims a band here                                                  |

---

## Current usage

| ID / band   | State                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US211–US223 | Done (RC-16 M3 canonical strategy path)                                                                                                                     |
| US224–US227 | Not implemented; superseded by RC-17 ownership (see Transfer note)                                                                                          |
| US240–US299 | RC-17 band — E17 US240–US249 (+ US244A) Done/baselined; US290–US293 Done (RC-18); US294–US295 open; US250–US289 soft for E18–E21                            |
| US240       | **Done (discovery slice)** — startup eligibility + deterministic candidate selection; force `RECOVERING` closed by US290                                    |
| US241       | **Done (lease ownership slice)** — CAS recovery lease acquire → `LEASE_ACQUIRED` \| `LEASE_DENIED`                                                          |
| US242       | **Done (checkpoint validation slice)** — `VALID_CHECKPOINT` \| `NO_CHECKPOINT` \| `INVALID_CHECKPOINT`; full assembly residual                              |
| US243       | **Done (read-only reconcile slice)** — `RECONCILED` \| `RECONCILIATION_FAILED`; real port adapters closed by US291                                          |
| US244       | **Done (READY hydration slice)** — deterministic Runtime resume to `READY`; worker remains idle/no event admission                                          |
| US245       | **Done (event admission slice)** — deterministic `EVENT_ADMISSION_ENABLED`; no evaluation / SignalIntent / Orders                                           |
| US246       | **Done (runtime arming slice)** — deterministic `EVENT_ADMISSION_ENABLED → ARMED`; no evaluation / SignalIntent / Orders                                    |
| US247       | **Done (evaluation-only slice)** — first deterministic strategy evaluation after ARMED; decision only, no SignalIntent / Orders                             |
| US248       | **Done (SignalIntent-only slice)** — deterministic SignalIntent from evaluated decision; no Orders / Execution / Accounting                                 |
| US249       | **Done (completion / Session-exit slice)** — recovery completion, Session exit from RECOVERING, lease release; RecoveryState/Incident closed by US292–US293 |
| US244A      | **Done (corrective)** — recovery pipeline bootstrap / stage-contract orchestration                                                                          |
| US290       | **Done (force/confirm RECOVERING)** — Session lifecycle precondition on discovery                                                                           |
| US291       | **Done (real reconcile ports)** — production stub retired; composition-root adapters                                                                        |
| US292       | **Done (RecoveryState + phase)** — durable phase machine within RECOVERING                                                                                  |
| US293       | **Done (Incident fail-closed)** — durable Incident on ambiguity; Session FAILED                                                                             |
| US294       | **Open (chaos/restart evidence)** — next mandatory residual                                                                                                 |
| US295       | **Open (ADL-008 closure)** — ACCEPTED or explicit accepted deferral                                                                                         |

### Transfer note (US224–US227)

The RC-16 M3 plan named recovery/validation stories US224–US227 under a temporary
“Epic E17.” Repository alignment (2026-07-30) assigns **Epic E17–E21 exclusively
to RC-17**. Those recovery intents live in RC-17 Epic E17 as new IDs in
US240–US249. Historical M3 plan text remains for audit; it is not an active
backlog.

---

## Future allocation policy

1. **One band per release** — claim the next free contiguous block in this file
   before writing stories.
2. **No silent reuse** — never recycle a closed or transferred ID.
3. **Epic sub-bands are soft** — crossing E17↔E18 sub-bands inside US240–US299
   is allowed if the Epic Spec documents it; crossing out of US240–US299 is not.
4. **Optional split IDs** — if a story must split, use the next free ID in the
   release band (prefer US290–US299 for late splits).
5. **Decimals / suffixes** — avoid new `US###.#` IDs except for documentation-
   only closeouts (e.g. US183.1). Prefer whole IDs.
6. **Update this file** in the same change set that opens a new release band or
   retires a range.
7. **Roadmap and Epic Specs** must cite this document for ID authority.

---

## Collision prevention checklist

Before assigning an ID:

- [ ] ID is inside the active release band (RC-17 ⇒ US240–US299)
- [ ] ID is not listed as Done, Transferred, or Retired above
- [ ] ID does not appear as an open story in project-status / Epic Spec
- [ ] This file is updated if the band policy changes
