# 016 — AI Integration

Version: 1.0

Status: Approved

Document Type: Sprint Specification

---

# Purpose

This document defines the AI Integration layer of the Trading Research Platform (TRP).

The AI Integration module provides a unified interface for interacting with Large Language Models (LLMs).

It abstracts AI providers behind a common API, allowing business modules to use AI capabilities without depending on a specific vendor.

---

# Business Value

Artificial Intelligence enhances research productivity, report generation, and analytical capabilities.

The AI Integration layer ensures that AI remains an independent service rather than becoming the center of the platform.

Business modules interact with AI through a stable interface.

---

# Goal

After completing this sprint:

- AI Gateway exists.
- AI Provider interface exists.
- OpenRouter provider is implemented.
- AI requests can be executed.
- AI responses are logged.
- Prompt templates are supported.

Version 1 supports a single AI provider.

---

# Out of Scope

This sprint does NOT implement:

- AI agents
- Multi-agent orchestration
- Autonomous decision making
- RAG
- Vector databases
- Fine-tuning
- Local LLMs
- Prompt optimization
- Memory systems
- AI voting
- AI planning

These capabilities belong to future versions.

---

# Architecture References

- ../CANONICAL.md
- 007-AI-Gateway.md
- 012-Service-Architecture.md
- 015-Security.md
- 020-Technology-Stack.md

Former multi-agent design: `../future/007-AI-Research-Organization.md` (do not implement in V1).

---

# Responsibilities

The AI Integration layer is responsible for:

- communicating with AI providers
- prompt execution
- response parsing
- provider abstraction
- prompt template management
- usage logging

The AI Integration layer is NOT responsible for:

- research
- validation
- workflow execution
- production trading
- business decisions

---

# Architecture

```
Research Laboratory

↓

AI Gateway

↓

AI Provider Interface

↓

OpenRouter

↓

LLM
```

Business modules never communicate directly with AI providers.

---

# AI Gateway

The AI Gateway provides a single public API for AI operations.

All modules use this gateway.

No module communicates directly with OpenRouter.

---

# AI Provider Interface

Every provider implements the same interface.

Examples:

- OpenRouter
- OpenAI
- Anthropic
- Gemini
- Local LLM

Version 1 implements only OpenRouter.

---

# Prompt Templates

Every AI request uses a predefined prompt template.

Prompt templates are version-controlled.

Templates remain outside business logic.

---

# Prompt Structure

Each prompt contains:

- System Prompt
- User Prompt
- Context
- Expected Output Format

---

# AI Tasks

Version 1 supports:

- Market Summary
- Strategy Explanation
- Research Summary
- Validation Explanation
- Report Generation

Additional tasks may be added later.

---

# Response Format

AI responses should be returned as structured JSON whenever possible.

Free-form text is discouraged.

The caller is responsible for displaying the result.

---

# AI Decision Policy

Artificial Intelligence may:

- explain
- summarize
- compare
- analyze
- recommend
- generate reports

Artificial Intelligence must never:

- open positions
- close positions
- submit orders
- override validation
- bypass workflow

Final decisions remain deterministic.

---

# Provider Configuration

Provider configuration includes:

- API Key
- Base URL
- Model
- Timeout

Configuration is stored in environment variables.

Secrets are never hardcoded.

---

# Error Handling

Handle:

- timeout
- invalid response
- provider unavailable
- rate limit exceeded

Errors are propagated to the caller.

Automatic retries are postponed.

---

# Logging

Log:

- request ID
- provider
- model
- execution time
- token usage
- success/failure

Never log:

- API keys
- sensitive prompts
- confidential data

---

# Metrics

Collect:

- request count
- average response time
- token usage
- provider errors
- successful responses

---

# Folder Structure

```
modules/

ai/

gateway/

providers/

prompts/

templates/

dto/

interfaces/

services/
```

---

# API

Internal service only.

No public REST endpoints are required in Version 1.

Business modules use dependency injection.

---

# Testing

Verify:

- provider connection
- prompt execution
- response parsing
- timeout handling
- logging
- metrics collection

---

# Manual Verification Checklist

Verify:

✓ AI Gateway works.

✓ OpenRouter connection succeeds.

✓ Prompt templates load.

✓ AI responses are parsed.

✓ Errors are handled correctly.

✓ Logs are generated.

---

# Acceptance Criteria

AI Gateway functions correctly.

OpenRouter provider works.

Prompt templates are supported.

Business modules can use AI through a common interface.

No module depends directly on OpenRouter.

---

# Definition of Done

Completed when:

- AI Gateway exists.
- Provider abstraction works.
- OpenRouter provider is implemented.
- Prompt templates function.
- Logging works.
- Tests pass.

---

# Common Mistakes

Avoid:

- Calling OpenRouter directly from business modules.
- Embedding prompts inside business logic.
- Allowing AI to execute trades.
- Hardcoding provider configuration.
- Assuming AI responses are always valid.
- Coupling business logic to a specific model.

---

# Next Step

017-Dashboard.md

---

# Summary

The AI Integration layer provides a clean abstraction over AI providers while keeping artificial intelligence as a supporting service rather than the core of the platform.

This design enables future provider replacement or expansion without affecting business modules.
