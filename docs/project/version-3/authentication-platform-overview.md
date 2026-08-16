# Authentication Platform Overview

**Document:** Version 3 Authentication Platform Overview  
**Date:** 2026-08-16  
**Status:** Product-facing record of V3-S01  
**Product:** Authentication Platform  
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

Companions (slice records, not rewritten here): [Session Lifecycle](./session-lifecycle-overview.md) · [Sign-in Sessions](./session-management-overview.md) · [Password Recovery](./password-recovery-overview.md).

---

## Purpose

The Authentication Platform is how an operator creates an account, signs in, stays signed in while working, ends a sign-in they no longer trust, recovers a forgotten password, or chooses a new password.

- The operator can: create an account, sign in with email and password, continue working without typing the password every few minutes, see and end sign-ins, recover access when host mail is configured, and change the password while signed in.
- The operator cannot (yet): turn on extra sign-in factors, use social sign-in, use passkeys, mark a device as trusted, or assign workspace roles.
- Why it exists, in business language: the product must know who is signed in, and that person must be able to get back in or rotate a password without an engineer.

---

## Customer Journey

```text
Create account, or Sign in
  ↓
Enter the paper-first product
  ↓
Keep working while the sign-in continues
  ↓
Open Sign-in sessions, or Password, or Forgot password
  ↓
End a sign-in, change the password, or follow recovery — or see honest unavailable
```

### Create account, or Sign in

From Sign in, create an account with name, email, and a password that includes a letter and a number, or sign in with an existing email and password. The form is empty. Live trading is not offered. Failed sign-in does not say whether the email is registered.

### Enter the paper-first product

A successful sign-in opens the paper-first operator. Workspace switching and the certified paper journey remain as they were.

### Keep working while the sign-in continues

The operator does not manage sign-in internals. If they keep using the product, they are not sent back to Sign in just because a few minutes passed. Signing out ends this device. If a leftover continue-permission is used again, that sign-in chain ends.

### Open Sign-in sessions, or Password, or Forgot password

Administration → Preferences → **Sign-in sessions** lists live sign-ins and marks **This device**. **Password** changes the password while signed in. From Sign in, **Forgot password?** starts recovery.

### End a sign-in, change the password, or follow recovery — or see honest unavailable

The operator can end another sign-in, end every other sign-in, or sign out everywhere. Changing the password signs other devices out and keeps this device. Recovery: if host mail is configured, instructions are sent without saying whether the email is registered; a recovery link works once. If mail is not configured, the product says recovery is unavailable. It does not claim a message was sent.

---

## Customer Experience

- Happy path (plain language): create an account, sign in, keep working, end an unknown sign-in, change the password, or recover when mail is available.
- If something fails, what they see (honest; no fake success): invalid email or password; recovery unavailable; invalid or expired recovery link; current password incorrect; passwords that do not meet the strength rules.
- What they never have to do (SSH, config files, pasting secrets into notes): they do not edit a server or a database to create an account, sign out a device, or set a password.
- Paper remains the default, or **NOT APPLICABLE** with reason: Paper remains the default. This product does not start trading.

---

## Customer Never Sees

What this product must not be mistaken for. Name the later product or Master Plan deferral.

- Not shown in the UI: extra sign-in factors, social sign-in, passkeys, remember me, trust-this-device, people/roles admin, or a form to configure outgoing mail.
- Not offered as a button, page, or implied “connected / live / recovered” state: live trading, exchange keys, vault. Recovery unavailable is not “email sent”.
- Owner later (product name, not a file path): roles; Credential Vault; extra sign-in factors before live; Notification email for operator alerts; Connection Management.

---

## Security Guarantees

What the operator can trust, stated as outcomes they can understand.

- What stays private (passwords, keys, messages — in product words): passwords are not shown back. Sign-in and recovery do not say whether an email is registered.
- What stops working when it should (ended sign-in, disconnected venue, revoked access): ending a sign-in takes effect immediately. After recovery, previous sign-ins end. After a signed-in password change, other devices end; this device stays. Repeated failed sign-ins lock the account for a cooldown.
- What the product will not pretend (no fake live, no fake sent email, no fake connected): it will not say instructions were sent when mail is not configured. It will not offer live trading from sign-in.
- What this overview does **not** claim (later security products): extra sign-in factors, a security audit product, customer-managed mail channels, platform-wide flood defenses.

---

## What's Next

What this overview does not unlock. One later customer capability, in plain language.

- Next thing the operator will be able to do: a workspace admin will be able to assign roles.
- Still not offered: extra sign-in factors, social sign-in, passkeys, remember me, trusted devices.
- Live trading, vault, billing, or other later products named only if the operator might assume they are included: live trading, vault, billing, and connection setup are not included.

---

**STOP.** Wait for review before V3-S02 begins.

**End of Version 3 Authentication Platform Overview.**
