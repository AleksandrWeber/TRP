# 10 — Glossary

**Audience:** Permanent AI Product Owner / Chief Architect
**Nature:** Terminology already used in Version 3 / governing architecture docs
**Rule:** Only terms already used in the project. Prefer Master Plan / policy / Spec definitions when wording differs.

Broader architecture glossary: [`../../v2-architecture-glossary.md`](../../v2-architecture-glossary.md) (Version 2 constitution companion).

---

## A

**Architecture Review**
Mandatory post-implementation review confirming no unjustified new bounded context, no ownership drift, no Source of Truth change, HTTP as transport, UI not SoT.

**Approval**
Explicit Product Owner go-ahead to write production code for **this package only** (or to proceed past a slice STOP).

**Audit Trail / Security Audit**
Security Platform capability for attributable security events. Wave 1 certifies **Security Audit Foundation**; full Customer Security Audit Product is later (F-05).

---

## C

**Canonical Order Path**
The sole paper/live execution path through Orders → Risk → Execution → Adapter → Fill → Position → Ledger. Version 3 must not replace it.

**Capability**
(1) Inventory ID such as SEC-* / CM-* in the Capability Inventory; (2) verified exchange capability metadata (Supported / Unsupported / Unavailable / Unknown) — observation, not enablement.

**Certification**
Independent audit against Master Plan / principles / policies, followed by Product Owner declaration. Distinct from package Close. Wave COMPLETE is a Product Owner certification decision.

**Close**
Product Owner acceptance that a package (or named gate) is done. Next package may open at Implementation Package. Close reports prepare evidence; only Product Owner declares Closed.

**Connected**
Context-dependent status word. Vault holding a secret ≠ venue Connected. Connection Management local validation ≠ exchange handshake. Exchange Connected = authenticated communication succeeded — **not** Trading enabled.

**Connection Management**
Wave 2 facade product for managing external connections without customer `.env`. Owns connection metadata/lifecycle/validation orchestration — not secrets or venue protocol.

**Customer Complete**
Operators can use the product surface (UI + workflow). Distinct from Platform Complete.

**Customer First**
Version 3 customer features usable without SSH, Docker, or editing customer `.env`. Host infrastructure may remain server-operated.

---

## F

**Facade**
Product surface over existing owners (e.g. Connection Management). Not a second Source of Truth for money or protocols.

**Fail closed**
When unsafe or uncertain, deny. Security Before Convenience.

---

## G

**Gate**
(1) Runtime / research Gate on the customer journey (admission before deploy/session); (2) Close “gates” such as Platform Complete vs Customer Complete.

---

## H

**Honest Product**
If the system cannot do something, it says so. Never show Connected for a simulation; never present unavailable journeys as available.

---

## I

**Implementation Package**
Planning artifact that freezes scope/slices/security/validation before Approval. Not production code.

**Implementation Report**
Record of what shipped (files, tests, limitations) after implementation of a slice or package.

---

## L

**Ledger**
Sole financial Source of Truth. Position/Portfolio are rebuildable projections. UI must not invent a second ledger.

**Live Trading**
Opt-in application of certified knowledge to real capital. Wave 6 only after Waves 1–4 and live-capital ADR. Unauthorized until then.

---

## O

**Ownership**
One product area, one owner. Consume ≠ own. Ownership changes require Master Plan revision.

---

## P

**Package**
Delivery unit with the mandatory lifecycle (`V3-*` or operational `W2-S*`). Identified before code.

**Paper Fill**
Simulated fill driven by a Market Data snapshot. Does **not** mean the exchange accepted an order.

**Paper Order**
Simulated trading intent. **Pending** means accepted by Paper Trading as intent — not executed and not filled.

**Paper Trading**
Simulated execution using Market Data without real exchange orders or real capital. Mandatory foundation before Live Trading.

**Planning**
Work before Approval (Implementation Package and companions). Production code prohibited.

**Platform Complete**
Domain complete and validated; future packages may consume it. Must not claim Customer Complete.

**Product Outcome**
Customer-visible result a package owns (what the operator can do after Close).

**Product Review**
Mandatory review of customer-visible outcomes and Product Walkthrough. Developer-only paths are not the product path.

**Product Owner**
Authority for Master Plan guardianship, Approval, Close, certification boundaries, and Wave COMPLETE declarations.

**Projection**
Non-mutating read model / UI view of an owner’s facts. Must not become a competing Source of Truth (especially for finance).

---

## S

**Security Review**
Mandatory review of Security Vision controls, fail-closed posture, checklists, STRIDE, and — when applicable — the Security Verification Standard and Security Regression Suite.

**Slice**
Independently reviewable increment inside a package (e.g. V3-S01-a, W2-S04-b). Slice PASS ≠ Package Close.

**Source of Truth (SoT)**
Single owner of a fact family. Projections, narratives, and command UI must not compete with it.

---

## V

**Validation**
Execution of the package validation plan with evidence. Mocked customer outcomes do not count as Close evidence.

**Vault / Credential Vault**
Justified new bounded context for customer secrets: encrypted at rest, write-only after save, no plaintext readback. Owns credentials only.

---

## W

**Wave**
Ordered Version 3 program stage (1–10) with customer-observable exit criteria.

**Workspace**
Isolation boundary. Membership owned by Workspace; trading/security aggregates belong to one workspace. Cross-workspace access fails closed.

---

## Cross-cutting principles (named in Master Plan)

| Term                            | Short meaning                                                              |
| ------------------------------- | -------------------------------------------------------------------------- |
| **AI Never Controls Capital**   | AI analyses/explains; does not decide, approve, size, or start trades      |
| **Live Must Be Earned**         | Live only after Waves 1–4, ADR, certified strategy, Gate PASS, human start |
| **One Source of Truth**         | No duplicate domains for money, lifecycle, risk, or certification          |
| **Paper First**                 | Prove on paper before offering live                                        |
| **Security Before Convenience** | Fail closed; assets over convenience                                       |

---

**STOP.** Do not invent glossary terms for undocumented concepts.
