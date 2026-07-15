# 002 — Development Environment

Version: 1.0

Status: Approved

Document Type: Implementation Guide

---

# Purpose

This document defines the official development environment for the Trading Research Platform (TRP).

Every developer and AI coding assistant should work within the same environment to ensure consistent behavior, reproducible builds, and predictable results.

The development environment must remain identical across all supported operating systems whenever possible.

---

# Goal

After completing this step:

- Development tools are installed.
- The project can be cloned.
- Dependencies install successfully.
- The development server can be started.
- Docker is operational.
- Git is configured.

No application code should be written during this step.

---

# Success Criteria

The development environment is considered ready when:

- Git is installed.
- Node.js is installed.
- pnpm is installed.
- Docker Desktop is installed.
- Cursor or VS Code is installed.
- Repository dependencies install successfully.
- Docker containers can be started.
- Git commits work correctly.

---

# Architecture References

This implementation follows:

- 020-Technology-Stack.md
- 018-Infrastructure.md
- 001-Repository-Foundation.md

---

# Supported Operating Systems

Primary:

- macOS

Supported:

- Windows
- Linux

All development instructions should remain platform-independent whenever possible.

---

# Required Software

## Git

Purpose:

Version control.

---

## Node.js

Purpose:

Application runtime.

Requirements:

- LTS Version only

---

## pnpm

Purpose:

Package manager.

pnpm is mandatory.

npm and yarn should not be used.

---

## Docker Desktop

Purpose:

Local infrastructure.

Required for:

- PostgreSQL
- Redis
- MinIO

---

## Cursor

Primary development environment.

Cursor is the officially recommended IDE.

VS Code remains fully supported.

---

# Required Cursor Extensions

Recommended:

- ESLint
- Prettier
- Docker
- GitLens
- Prisma
- Tailwind CSS IntelliSense

Extensions should improve productivity without changing project behavior.

---

# Repository Setup

Clone repository.

Install dependencies.

Verify installation.

No manual modifications should be required.

---

# Environment Variables

The project includes:

.env.example

Every developer creates:

.env

Secrets are never committed to Git.

---

# Development Commands

The repository should expose standard commands.

Examples:

Install dependencies

Start development

Build project

Run tests

Lint

Format

Commands should be identical across all applications.

---

# Docker Environment

Docker starts local infrastructure.

Required containers:

- PostgreSQL
- Redis
- MinIO

Application containers are added later.

---

# Git Configuration

Developers should configure:

User Name

User Email

Line endings

SSH authentication is recommended.

---

# Code Formatting

Formatting is automatic.

Prettier is the single formatting standard.

Manual formatting should be unnecessary.

---

# Linting

ESLint verifies code quality.

Every project must pass linting before commit.

---

# Git Hooks

Git hooks execute automatically.

Examples:

- Lint
- Format
- Type Check

Failed hooks prevent commits.

---

# Type Checking

TypeScript errors must always be resolved.

The project should never compile with known type errors.

---

# Folder Permissions

Generated files:

- node_modules
- build
- dist

must remain ignored.

Only source code belongs in Git.

---

# Troubleshooting

Common problems include:

- Node version mismatch
- Missing Docker service
- Incorrect environment variables
- Missing pnpm installation

Every issue should be documented.

---

# Definition of Done

This step is complete when:

- Repository is cloned.
- Dependencies install successfully.
- Docker starts correctly.
- Git is configured.
- Development tools are operational.

No application code exists yet.

---

# Common Mistakes

Avoid:

- Using npm instead of pnpm.
- Using non-LTS Node.js.
- Committing .env files.
- Installing unnecessary global packages.
- Disabling Git hooks.

---

# Next Step

Continue with:

003-Monorepo.md

---

# Summary

The Development Environment establishes a consistent, reproducible workspace for every contributor.

A standardized environment minimizes configuration problems, reduces onboarding time, and ensures that all future implementation steps behave predictably.
