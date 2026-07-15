# 007 — AI Gateway

Version: 1.1

Status: Approved

Document Type: Architecture Specification

Source of truth: [`../CANONICAL.md`](../CANONICAL.md)

---

# Purpose

V1 AI is a **Gateway** to OpenRouter.

It summarizes and explains research — it does not trade, approve deployment, or hold exchange credentials.

The former multi-agent “AI Research Organization” design is deferred:

[`../future/007-AI-Research-Organization.md`](../future/007-AI-Research-Organization.md)

---

# Responsibilities (V1)

- Call OpenRouter with structured prompts
- Summarize experiment / validation reports
- Answer read-only questions about stored research (when wired)
- Fail soft if the provider is unavailable (core platform keeps working)

---

# Forbidden

- Placing orders
- Changing strategy parameters in production
- Approving deployment
- Bypassing validation or risk
- Direct exchange API access
- Acting as sole authority for any capital decision

---

# Design notes

- Provider-agnostic interface behind OpenRouter
- Prompts versioned with experiments where possible
- Log model id, prompt template version, and response metadata for audit
- No SHIELD in V1 — see [`../future/`](../future/)

---

# Relationship to Implementation

See [`../Implementation/016-AI-Integration.md`](../Implementation/016-AI-Integration.md).
