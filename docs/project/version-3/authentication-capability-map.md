# Authentication Capability Map

**Document:** Version 3 Authentication Capability Map
**Date:** 2026-08-16
**Status:** Product inventory after V3-S01 Close
**Product:** Authentication Platform
**Nature:** Customer capability map. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

One page. What the customer can do now, and what they cannot. Not how it is built.

---

## Authentication Platform

| Capability         | Status        | Reference |
| ------------------ | ------------- | --------- |
| Registration       | **Delivered** | S01-a     |
| Login              | **Delivered** | S01-b     |
| Lockout            | **Delivered** | S01-b     |
| Refresh            | **Delivered** | S01-c     |
| Rotation           | **Delivered** | S01-c     |
| Session Management | **Delivered** | S01-d     |
| Password Recovery  | **Delivered** | S01-e     |
| Password Change    | **Delivered** | S01-e     |

The operator can create an account, sign in, stay signed in while working, see and end sign-ins, recover a forgotten password when host mail is available (or see honest unavailable), and change the password while signed in.

---

## Future

| Capability         | Status          | Reference     |
| ------------------ | --------------- | ------------- |
| Email Verification | **Not Planned** | —             |
| MFA                | **Deferred**    | Wave 6 — live |
| OAuth              | **Not Planned** | —             |
| Passkeys           | **Not Planned** | —             |
| Trusted Devices    | **Not Planned** | —             |
| Remember Me        | **Not Planned** | —             |

The operator cannot turn on extra sign-in factors, use social sign-in, use passkeys, mark a device as trusted, or stay signed in by weakening the sign-in.

---

**STOP.** Wait for review before V3-S02 begins.

**End of Version 3 Authentication Capability Map.**
