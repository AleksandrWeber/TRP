# Sign-in Sessions Overview

**Document:** Version 3 Sign-in Sessions Overview  
**Date:** 2026-08-16  
**Status:** Product-facing record of S01-d  
**Product:** Sign-in Sessions  
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

Sign-in Sessions shows where the operator is signed in and lets them end a sign-in they no longer trust.

- The operator can: see active sign-ins, tell which one is this device, end another sign-in, end every other sign-in, or sign out everywhere.
- The operator cannot (yet): recover a forgotten password, turn on extra sign-in factors, or mark a device as trusted.
- Why it exists, in business language: leftover or unknown sign-ins should be visible and endable without asking an engineer.

---

## Customer Journey

```text
Open Sign-in sessions
  ↓
See active sign-ins
  ↓
This device is marked
  ↓
End another sign-in, or end every other sign-in, or sign out everywhere
  ↓
That sign-in loses access immediately
```

### Open Sign-in sessions

From the signed-in shell, under Administration → Preferences, open **Sign-in sessions**. Header **Logout** still ends only this device.

### See active sign-ins

Each row is a live sign-in: device and browser, network address if known, when it was signed in, and when it last continued. If there is no network address, the product says location is unavailable. It does not invent a city.

### This device is marked

The row for this browser is labeled **This device**. That row is not ended by “End all other sign-ins”.

### End another sign-in, or end every other sign-in, or sign out everywhere

The product asks for confirmation. Ending another sign-in, or every other sign-in, leaves this device signed in. **Sign out everywhere** ends this device too and returns to sign-in.

### That sign-in loses access immediately

The other device cannot keep working. If that device tries to continue, it is sent to sign in again.

---

## Customer Experience

- Happy path (plain language): open Sign-in sessions, recognize this device, end a sign-in that is not yours, stay signed in here.
- If something fails, what they see (honest; no fake success): a short error if the list cannot load or an end action cannot complete. If that sign-in is already gone, they are told it is no longer listed.
- What they never have to do (SSH, config files, pasting secrets into notes): they do not edit a server or a database to kill a sign-in.
- Paper remains the default, or **NOT APPLICABLE** with reason: Paper remains the default. This page does not start trading.

---

## Customer Never Sees

What this product must not be mistaken for. Name the later product or Master Plan deferral.

- Not shown in the UI: password recovery, extra sign-in factors, social sign-in, passkeys, remember me, or a trust-this-device control.
- Not offered as a button, page, or implied “connected / live / recovered” state: live trading, exchange keys, vault, people/roles admin.
- Owner later (product name, not a file path): Password recovery (next authentication slice); extra sign-in factors before live; Credential Vault; Connection Management; roles.

Do not list internal types, routes, or table names here. List things an operator might look for and not find.

---

## Security Guarantees

What the operator can trust, stated as outcomes they can understand.

- What stays private (passwords, keys, messages — in product words): passwords are not shown on this page. Sign-in secrets are not listed.
- What stops working when it should (ended sign-in, disconnected venue, revoked access): an ended sign-in cannot keep using the product. Sign out everywhere ends this device as well.
- What the product will not pretend (no fake live, no fake sent email, no fake connected): a network address is not a map. This is not a trusted-device list.
- What this overview does **not** claim (later security products): forgotten-password recovery, extra sign-in factors, a security audit product.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## What's Next

What this overview does not unlock. One later customer capability, in plain language.

- Next thing the operator will be able to do: recover a forgotten password and change a password while signed in.
- Still not offered: extra sign-in factors, social sign-in, passkeys, remember me, trusted devices.
- Live trading, vault, billing, or other later products named only if the operator might assume they are included: live trading, vault, billing, and connection setup are not included.

---

**STOP.** Wait for review before S01-e Password Recovery begins.

**End of Version 3 Sign-in Sessions Overview.**
