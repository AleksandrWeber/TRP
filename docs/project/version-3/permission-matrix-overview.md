# Permission Matrix Overview

**Document:** Version 3 Permission Matrix Overview  
**Date:** 2026-08-16  
**Status:** Product-facing record of V3-S02 Close  
**Product:** Roles and permissions  
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is for the product owner and the Administrator who assigns roles. It is not an engineering note.

---

## Purpose

Four roles exist: Reader, Researcher, Trader, and Administrator. An Administrator assigns them in People. Each person can only do what their role allows.

- The operator can: see, in one place, what each role may view, do, or not do.
- The operator cannot (yet): invite a teammate into someone else’s workspace, store venue secrets, start live trading, or skip safety checks.
- Why it exists, in business language: the host should not share one Administrator password. Least privilege is a product decision.

---

## Who may do what

**✅** can do this · **👁️** can view · **❌** cannot

| Capability                    | Reader | Researcher | Trader | Administrator |
| ----------------------------- | :----: | :--------: | :----: | :-----------: |
| Overviews and reports         |   👁️   |     👁️     |   👁️   |      👁️       |
| Knowledge Lake                |   👁️   |     👁️     |   👁️   |      👁️       |
| Strategy Library              |   👁️   |     👁️     |   👁️   |      👁️       |
| Research                      |   ❌   |     ✅     |   ✅   |      ✅       |
| Certification                 |   ❌   |     ✅     |   ✅   |      ✅       |
| Paper Trading                 |   ❌   |     ❌     |   ✅   |      ✅       |
| People                        |   ❌   |     ❌     |   ❌   |      ✅       |
| Role Assignment               |   ❌   |     ❌     |   ❌   |      ✅       |
| Sign-in sessions and password |   ✅   |     ✅     |   ✅   |      ✅       |
| Live Trading                  |   ❌   |     ❌     |   ❌   |      ❌       |
| Vault                         |   ❌   |     ❌     |   ❌   |      ❌       |
| Skip Gate or Risk             |   ❌   |     ❌     |   ❌   |      ❌       |

A new account is always **Researcher**. Nobody becomes Administrator by registering.

Knowledge Lake and Strategy Library in this product are browse and search for every signed-in role. Research and Certification are the actions that change the library.

Administrator is not “every privilege.” Paper Trading is allowed for Administrator because it is listed here — not because Administrator silently includes Trader. Live Trading, Vault, and skipping Gate or Risk are listed for nobody.

Assigning a role does **not** put that person into someone else’s workspace. Each person still uses the workspace they already own.

---

## Customer Journey

```text
Sign in as Administrator
  ↓
Open People
  ↓
See who is here and their current role
  ↓
Choose Reader, Researcher, Trader, or Administrator for someone else
  ↓
Confirm
  ↓
The new role applies on their next action
```

### Sign in as Administrator

Sign in as usual. A role is not a second login.

### Open People

Under Administration, open **People**. Anyone who is not an Administrator sees that People is unavailable — not an empty list.

### See who is here and their current role

Each row is a person: name, email, and current role. Your own row is labeled **You**.

### Choose Reader, Researcher, Trader, or Administrator for someone else

The product offers only these four roles. Use the table above to pick the least privilege that person needs.

### Confirm

The product asks before it changes anything. It will not remove the last active Administrator. If you try to change your own role, it refuses and explains why.

### The new role applies on their next action

They keep their sign-in. They do not need a new password. Their next action uses the new role.

---

## Customer Experience

- Happy path (plain language): open People, choose a lower or higher role, confirm, see it stick. That person then only gets what the table allows.
- If something fails, what they see (honest; no fake success): People unavailable if they are not an Administrator; a short error if the last Administrator would be removed; a short error after they try to change themselves; a refusal if they try another role’s actions.
- What they never have to do (SSH, config files, pasting secrets into notes): they do not share an Administrator password, edit a database, or ask an engineer to become a Trader.
- Paper remains the default, or **NOT APPLICABLE** with reason: Paper remains the default. No role starts live trading.

---

## Customer Never Sees

- Not shown in the UI: invite teammate, disable person, billing, API keys, vault, connection setup, live trading, a searchable security history, extra sign-in factors.
- Not offered as a button, page, or implied “connected / live / recovered” state: live trading, exchange keys, vault, or a shared team workspace.
- Owner later (product name, not a file path): Credential Vault; Connection Management; live trading; teammate invitations; a security history of role changes.

---

## Security Guarantees

- What stays private: passwords and sign-in secrets are not shown when a role is changed.
- What stops working when it should: a Reader cannot start research or paper trading. A Researcher cannot start paper trading. A Trader cannot open People or assign roles. You cannot take away your own Administrator role. The last Administrator cannot be removed.
- What the product will not pretend: unavailable is unavailable. Administrator is not a skip for Gate or Risk. A new Administrator is not automatically in someone else’s workspace.
- What this overview does **not** claim: a searchable security history, extra sign-in factors, vault, or live trading.

---

## What's Next

- Next thing the operator will be able to do: after this package, the next security product is storing venue secrets in a vault. That is later work.
- Still not offered: inviting teammates, disabling people, extra sign-in factors, searching a security history.
- Live trading, vault, billing, and connection setup are not included.

---

**End of Version 3 Permission Matrix Overview.**
