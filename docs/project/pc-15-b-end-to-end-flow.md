# PC-15 Slice 15-b — End-to-End Flow

**Package:** PC-15 slice 15-b  
**Date:** 2026-08-15

---

## Certified path

```text
Request Qualification
  → Confirm (heavy-work rule)
  → Complete (Qualification owner)
  → publishProfileVersion (Profile owner, via product-flow)
  → latest version advances
  → query / consumer read observe the new version immediately
```

## Requalify

```text
New Qualification run
  → Complete
  → new Profile version (n+1)
  → version n remains readable and frozen
```

## Non-publish paths

```text
Fail  → no Profile version
Cancel → no Profile version
Retry same completed run → same Profile version (idempotent)
```

## What the customer can observe (in-process)

- Completed Qualification produces a published Profile id (`publishedProfileId`).
- `getLatestProfile` / consumer projection return the new version.
- `listProfileVersions` includes prior versions unchanged.
- Qualification run records are not rewritten by publish.

No new screen. No new REST. PC-08 / PC-09 remain the later product surfaces.

---

**End of End-to-End Flow.**
