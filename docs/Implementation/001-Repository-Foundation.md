# 001 — Repository Foundation

Version: 1.0

Status: Approved

Document Type: Implementation Guide

---

# Purpose

This document defines how the Trading Research Platform (TRP) repository is created and organized.

The repository is the foundation of the project.

Its structure should remain stable throughout Version 1.

Every engineer and AI assistant must follow the same repository organization.

---

# Goal

After completing this step the project must have:

- Monorepo initialized
- Git repository initialized
- Standard directory structure
- Development configuration
- Documentation structure
- Initial project files

No business logic should exist yet.

---

# Success Criteria

After this step:

- Repository can be cloned.
- Project installs successfully.
- Folder structure is complete.
- Documentation is organized.
- Development environment is ready.
- First commit is created.

---

# Architecture References

This implementation follows:

- ../CANONICAL.md
- 00-Architecture-Principles.md (via docs root)
- 02-Architecture.md
- 020-Technology-Stack.md

---

# Repository Name

Repository:

```
trp
```

Root directory:

```
trp/
```

---

# Repository Structure

```
trp/

apps/
packages/
docs/
infrastructure/
scripts/

.github/

.env.example
.editorconfig
.gitignore
.prettierrc
.prettierignore
.eslintrc.cjs
package.json
pnpm-workspace.yaml
README.md
LICENSE
```

Nothing else should exist at the root level.

---

# apps/

Application entry points.

```
apps/

frontend/
backend/
worker/
```

Each application is independently buildable.

---

# packages/

Shared libraries.

```
packages/

shared/
ui/
types/
config/
sdk/
```

Packages contain reusable code only.

No business logic.

---

# docs/

Project documentation.

```
docs/

Architecture/
Implementation/
```

Architecture documents are frozen.

Implementation documents evolve.

---

# infrastructure/

Infrastructure configuration.

Examples:

```
docker/

compose/

nginx/

database/
```

Only deployment-related files belong here.

---

# scripts/

Automation scripts.

Examples:

```
setup

build

backup

restore

seed
```

Scripts should be platform-independent whenever possible.

---

# .github/

GitHub configuration.

```
.github/

workflows/

ISSUE_TEMPLATE/

PULL_REQUEST_TEMPLATE.md
```

Repository automation belongs here.

---

# Root Configuration

The repository contains:

```
README.md

LICENSE

.gitignore

.editorconfig

.prettierrc

.eslintrc.cjs

package.json

pnpm-workspace.yaml
```

Configuration should remain centralized.

---

# Branch Strategy

Main branches:

```
main

develop
```

Feature branches:

```
feature/...

bugfix/...

hotfix/...

docs/...
```

Never commit directly to main.

---

# Commit Convention

Commits follow Conventional Commits.

Examples:

```
feat:

fix:

docs:

refactor:

test:

chore:

build:

ci:
```

Every commit should describe one logical change.

---

# Version Control Rules

Always commit:

- Source code
- Configuration
- Documentation

Never commit:

- Secrets
- Generated files
- Build artifacts
- Dependencies
- Logs

---

# Naming Conventions

Directories

```
kebab-case
```

Files

```
kebab-case
```

React Components

```
PascalCase
```

Variables

```
camelCase
```

Classes

```
PascalCase
```

Constants

```
UPPER_SNAKE_CASE
```

---

# Documentation Rules

Every major directory should contain a README.md describing its purpose.

Documentation lives inside `/docs`.

No documentation should be scattered throughout the repository.

---

# Repository Rules

The repository should always remain:

- Clean
- Predictable
- Well organized
- Easy to navigate

Developers should never wonder where code belongs.

---

# Initial Commit

The first commit includes only:

- Repository structure
- Configuration
- Documentation
- Development tooling

No application code.

---

# Definition of Done

This step is complete when:

- Repository structure exists.
- Git is initialized.
- Project installs successfully.
- Documentation structure exists.
- Development tools are configured.
- Initial commit is created.

No additional functionality is required.

---

# Common Mistakes

Avoid:

- Mixing frontend and backend code.
- Adding business logic.
- Creating unnecessary directories.
- Installing unused dependencies.
- Committing generated files.
- Committing secrets.
- Creating deep folder hierarchies.

Keep the repository simple.

---

# Next Step

Continue with:

```
002-Development-Environment.md
```

---

# Summary

The Repository Foundation establishes a clean, predictable, and maintainable starting point for TRP.

This step creates the project's permanent structure while intentionally avoiding business logic.

A well-organized repository reduces future complexity and improves long-term maintainability.
