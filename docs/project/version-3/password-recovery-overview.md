# Password Recovery Overview

**Document:** Version 3 Password Recovery Overview
**Date:** 2026-08-16
**Status:** Product-facing record of S01-e
**Product:** Password Recovery
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

Password Recovery lets an operator get back into the account after forgetting the password, or choose a new password while still signed in.

- The operator can: ask for recovery, follow host mail instructions when mail is available, set a new password, and change the password from the signed-in shell.
- The operator cannot (yet): turn on extra sign-in factors, use social sign-in, or mark a device as trusted.
- Why it exists, in business language: losing a password should not require an engineer, and rotating a password should sign out devices the operator no longer intends to keep.

---

## Customer Journey

```text
Forgot password, or open Password while signed in
  ↓
Ask for recovery, or enter the current password
  ↓
Host mail sends instructions — or the product says recovery is unavailable
  ↓
Choose a new password
  ↓
Sign in with the new password, or stay signed in here after a change
```

### Forgot password, or open Password while signed in

From Sign in, choose **Forgot password?** Or, while signed in, open Administration → Preferences → **Password**.

### Ask for recovery, or enter the current password

Recovery asks only for the account email. A signed-in change asks for the current password and the new one, then confirms that other devices will be signed out.

### Host mail sends instructions — or the product says recovery is unavailable

If the people who run the system have configured mail, the product says that if an account exists for that email, instructions will be sent. It does not tell you whether the email is registered. If mail is not configured, the product says recovery is unavailable. It does not claim a message was sent.

### Choose a new password

The new password must meet the same strength rules as creating an account. A recovery link works once and does not last. If the link is missing, old, or already used, the product says it is invalid or has expired.

### Sign in with the new password, or stay signed in here after a change

After recovery, sign in with the new password. The old password is rejected. Every previous sign-in has ended. After a signed-in change, this device stays signed in and other devices lose access.

---

## Customer Experience

- Happy path (plain language): forgot the password, received instructions, chose a new one, signed in; or changed the password while working and stayed on this device.
- If something fails, what they see (honest; no fake success): recovery unavailable; invalid or expired link; current password incorrect; passwords that do not match the strength rules.
- What they never have to do (SSH, config files, pasting secrets into notes): they do not edit a server or a database to set a password.
- Paper remains the default, or **NOT APPLICABLE** with reason: Paper remains the default. This product does not start trading.

---

## Customer Never Sees

What this product must not be mistaken for. Name the later product or Master Plan deferral.

- Not shown in the UI: extra sign-in factors, social sign-in, passkeys, remember me, trust-this-device, or a form to configure outgoing mail.
- Not offered as a button, page, or implied “connected / live / recovered” state: live trading, exchange keys, vault, people/roles admin. Recovery unavailable is not “email sent”.
- Owner later (product name, not a file path): extra sign-in factors before live; Notification email for operator alerts; Credential Vault; roles; Connection Management.

---

## Security Guarantees

What the operator can trust, stated as outcomes they can understand.

- What stays private (passwords, keys, messages — in product words): passwords are not shown back. Recovery does not say whether an email is registered.
- What stops working when it should (ended sign-in, disconnected venue, revoked access): after recovery, previous sign-ins end. After a signed-in change, other devices end; this device stays.
- What the product will not pretend (no fake live, no fake sent email, no fake connected): it will not say instructions were sent when mail is not configured.
- What this overview does **not** claim (later security products): extra sign-in factors, a security audit product, customer-managed mail channels.

---

## What's Next

What this overview does not unlock. One later customer capability, in plain language.

- Next thing the operator will be able to do: a workspace admin will be able to assign roles (after Authentication & Session is closed).
- Still not offered: extra sign-in factors, social sign-in, passkeys, remember me, trusted devices.
- Live trading, vault, billing, or other later products named only if the operator might assume they are included: live trading, vault, billing, and connection setup are not included.

---

**STOP.** Wait for review before V3-S02 begins.

**End of Version 3 Password Recovery Overview.**
