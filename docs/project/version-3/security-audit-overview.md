# Security Audit Overview

**Document:** Version 3 Security Audit Overview
**Date:** 2026-08-17
**Status:** V3-S05-d implemented — Incident Attribution & Investigation. A web page remains a later slice.
**Product:** Security Audit Product (Audit Trail Foundation)
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

## Today

The operator does not yet see a Security Audit page. The platform now builds
an investigation from linked security history internally: it keeps the
original records unchanged, reads them in order, and states security and
financial impact only from what those records establish. There is still no
screen, search box, download, alert, or direct integrity view in this slice.

The platform can also prepare the same investigation evidence in the same
order every time. It has an internal retention timetable, but it does not
silently erase history.

---

## Purpose

Security Audit is the product history of important security actions. It exists so an Administrator can later answer: who signed in, who changed a role, who created or revoked a secret, what was refused, and when — without asking an engineer to read server logs.

It is built as **forensic security history**: attributable, searchable, and trustworthy. It is not a monitoring dashboard. It is not a place to edit the past.

- The operator can (after this package Closes): open Security Audit / Security History; see a timeline; search and filter; understand who did what; trust that ordinary product use cannot silently rewrite that history; optionally export a filtered non-secret excerpt if that capability is approved.
- The operator cannot (yet): connect exchanges, trade live, open a monitoring/Grafana product, finish the isolation suite product, or treat this screen as a live financial order log.
- Why it exists, in business language: a platform that will hold real credentials and later capital-adjacent power must keep a security history operators can use and trust — not only logs that disappear into infrastructure.
- If something is refused in audit access: non-Administrators see unavailable or denied. Cross-workspace history is not shown. The product does not pretend monitoring or live trading is included.

---

## Customer Journey (future web experience)

```text
Sign in as Administrator
  ↓
Open Security Audit / Security History
  ↓
See a chronological timeline of security events
  ↓
Filter or search for a known change (role, sign-in problem, vault change)
  ↓
Read who / what / when / outcome — without secrets
  ↓
Leave history unchanged (no edit, no delete)
```

### Sign in as Administrator

The operator uses the usual sign-in. Security Audit does not invent a second login.

### Open Security Audit / Security History

Under Administration (alongside People-style surfaces), the Administrator opens the security history product.

### See a chronological timeline

Recent security events appear in order. Examples the product is meant to cover once prior packages have emitted them: sign-in outcomes, session ends, role changes and refusals, vault create/revoke/delete, and platform abuse refusals.

### Follow the investigation story

The future Security History experience follows time forward. It labels whether
each event concerns entry, persistence, escalation, credential impact, or
pressure, so the sequence reads as an investigation rather than as raw logs.
Search and filtering are not part of this slice.

### Understand an incident without rewriting history

An investigation can collect the security records that belong together. The
original records remain the evidence: the investigation does not make a second
copy or fill gaps with guesses. It can show who acted, what happened, when it
happened, what came before and after, and whether the recorded events affected
security or access to future financial actions.

### Read attribution without secrets

Each event shows enough to explain what happened: who acted (when known), what kind of action, when, which workspace scope applies, and whether it succeeded or was refused. Passwords, session tokens, and vault secret values never appear.

### Leave history unchanged

There is no normal product path to edit or erase an event. Security history is for reconstruction, not for rewriting.

---

## Customer Experience

- Happy path (plain language): an Administrator investigates a role change or a suspicious sign-in pattern in Security Audit and finds a clear, attributable trail.
- If something fails, what they see (honest; no fake success): non-Administrators cannot use the audit product; missing permissions are refused clearly; the product never shows secret material to “help debugging.”
- What they never have to do: SSH into a host, scrape application logs, paste secrets into tickets, or ask an engineer to prove a role change happened.
- Paper remains the default: **Yes.** Viewing security history does not start live trading and does not connect a venue.

---

## What this product is careful about (forensic meaning, in plain language)

### Critical for security

Sign-in failures and lockouts, session ends, role changes, vault secret lifecycle, and refused privileged actions. These answer: was access abused, escalated, or cleaned up?

### Critical for financial integrity (before live trading exists)

Not the money ledger. The precursors: who became Trader or Administrator, which secrets were created or revoked, which sessions were ended. Later live trading will need its own financial action history; this product keeps the security steps that made capital risk possible or impossible.

### Critical for user trust

Clear records of refusals and session changes so an Administrator can explain “why was this blocked?” and “was this account used on another device?”

### Must not vanish or change quietly

Security history is append-only in the product. Operators do not get an Edit or Delete button for past events. Retention, if it archives old history later, is a defined system policy — not a silent wipe from the Admin screen.

### How the operator finds events

Timeline first; then filter and search. The product is built so investigation is a normal Admin task.

### How the future can trust the journal

The operator cannot yet inspect integrity directly, but the Security Audit
Product now protects record integrity internally. Ordinary product use cannot
rewrite or erase stored history, and an internal check can identify a record
that no longer matches its original contents. This does **not** claim a
monitoring alert console, independent outside verification, or the full
live-trading tamper product that comes in a later wave.

### Keep and share evidence safely

The platform has an internal foundation to prepare an investigation record
from the original security history. It uses the same evidence each time and
does not add passwords, sign-in tokens, or secret values. It does not yet offer
an operator download button or silently remove old history.

---

## Customer Never Sees

What this product must not be mistaken for. Name the later product or Master Plan deferral.

- Not shown in the UI: Connection Management, Connect-and-test against Binance, Telegram delivery, email send, AI chat as a new key path, live trading, billing, Grafana/monitoring dashboards, isolation “proof suite” as this screen.
- Not offered as a button or implied state: edit/delete past security events; “Wave 1 complete”; “unforgeable forever”; live enabled because audit exists.
- Owner later (product name, not a file path): Workspace Isolation suite; Connection Management; Security monitoring / health dashboard; Financial action logging for live trading; compliance retention finalization.

Do not list internal types, routes, or table names here. List things an operator might look for and not find.

---

## Security Guarantees

What the operator can trust, stated as outcomes they can understand.

- What stays private: passwords, sign-in tokens, vault secret values, and wrapping keys are never part of Security Audit.
- What stops working when it should: non-Administrators cannot browse security history; another workspace’s history is not visible; rewriting history is not a product feature.
- What the product will not pretend: that monitoring is included; that live trading is on; that this screen is the money ledger; that Connections exist because history exists.
- What this overview does **not** claim: Isolation suite complete; Wave 1 exit alone; external penetration test results; perfect protection if the entire host database is compromised by an attacker with admin disk access.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## What's Next

What this overview does not unlock. One later customer capability, in plain language.

- Security Audit implementation is ready for Product Owner Close review.
  Search, filtering, monitoring, and the web page remain later Audit work.
  After Product Owner Close approval, the next product package is the
  Isolation suite.
- Still not offered after S05 alone: Binance connect, Telegram, email send, billing, live trading, monitoring dashboards.
- Live trading and financial action history are later products. Security Audit remains the security-side history those later products will build on.

---

## Related planning documents

| Document                                                                           | Role                                                 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`v3-s05-implementation-package.md`](./v3-s05-implementation-package.md)           | Umbrella package                                     |
| [`v3-s05-product-scope.md`](./v3-s05-product-scope.md)                             | IN / OUT                                             |
| [`v3-s05-security-review.md`](./v3-s05-security-review.md)                         | Threat / integrity planning                          |
| [`v3-s05-validation-plan.md`](./v3-s05-validation-plan.md)                         | How Close is proven                                  |
| [`security-event-classification.md`](./security-event-classification.md)           | Event-class criticality / trust / retention / search |
| [`incident-investigation-walkthrough.md`](./incident-investigation-walkthrough.md) | Unauthorized-access investigation scenario           |

---

**Approved.** Implementation may begin at S05-a … S05-e per the Implementation Package.
