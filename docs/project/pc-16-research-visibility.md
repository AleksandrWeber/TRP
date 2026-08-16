# PC-16 Knowledge Lake Product — Research Visibility

**Package:** PC-16  
**Date:** 2026-08-16  
**Verdict:** Research remains research owner. Lake remains a projection warehouse. The two surfaces stay distinct.

---

## Distinct products

| Surface                          | Path / REST                              | Owner                     | This package  |
| -------------------------------- | ---------------------------------------- | ------------------------- | ------------- |
| Research Knowledge (US079 / 014) | `/knowledge` · `/v1/knowledge`           | Research Knowledge domain | **Unchanged** |
| Knowledge Lake warehouse         | `/knowledge-lake` · `/v1/knowledge-lake` | Knowledge Lake            | **Exposed**   |
| Research Lab / campaigns / RCC   | `/research`, `/lab`, …                   | Research                  | Unchanged     |

PC-16 does not rename Research Knowledge pages. Operators can still search Implementation 014 entries at `/knowledge`. Lake Home links to Research Knowledge as a different slice.

## What Lake shows from Research

Research Lab already admits analytical markers (`producer: research-lab`) with `sourceRef` to `CampaignSession`, `Experiment`, or `KnowledgeEntry`. The product UI displays those existing refs as Connected Research. It does not clone Insight, Recommendation, or KnowledgeEntry bodies.

## What Lake does not do

- Own research experiments or knowledge entries
- Replace `/knowledge` search
- Feed Research as a new SoT
- Let Research write the Lake from this adapter

---

**End of Research Visibility.**
