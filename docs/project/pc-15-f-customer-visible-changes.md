# PC-15 Slice 15-f — Customer-visible Changes

**Package:** PC-15 slice 15-f  
**Date:** 2026-08-15

---

## What an operator can now see

| Surface                          | Change                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| Command Center session detail    | Latest report run status and whether a narrative is attached. Honest empty when none. |
| Command Center session inspector | Same report and delivery status next to lifecycle / runtime.                          |
| Command Center session GET       | Additive `latestReport` and `delivery` fields on the existing resource.               |
| Home overview                    | Paper session count and runtime health from APIs that already exist.                  |

---

## What an operator still cannot do

- Open a product Reporting UI (`/reports` is not RC-24 Reporting; PC-05 is next).
- Treat RCC `/dashboard` as product ReportRuns.
- Send notifications from Command Center.
- Use Telegram as a control plane.
- See Live Trading or `/production`.

---

## Copy honesty

Empty states say the fact is absent. They do not say Coming Soon. They do not invent tiles for REST that does not exist.

---

**End of Customer-visible Changes.**
