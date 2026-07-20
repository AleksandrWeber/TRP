# GitHub CI/CD (RC-3)

Official GitHub Actions workflows for the Trading Platform.

## Workflows

| File                         | Trigger                         | Purpose                                                      |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------ |
| `workflows/ci.yml`           | push to main/develop/feature/** | Lint, typecheck, build, DB, tests, architecture, smoke       |
| `workflows/pull-request.yml` | pull_request                    | Repository, lint, types, tests, architecture, security, docs |
| `workflows/release.yml`      | tag `v*` / workflow_dispatch    | Full RC-2 pipeline, artifacts, GitHub Release                |
| `workflows/nightly.yml`      | cron 02:00 UTC                  | Full suite + audit + performance; opens issue on failure     |
| `workflows/security.yml`     | daily + push main               | `pnpm audit`, secret scan, license inventory                 |

## Local ↔ CI mapping

| Local                   | GitHub                                         |
| ----------------------- | ---------------------------------------------- |
| `pnpm release:rc`       | release.yml (RC-2 pipeline; git skipped in CI) |
| `pnpm release:validate` | release.yml / nightly                          |
| Architecture gates      | `.github/scripts/ci/architecture-check.ts`     |

## Artifacts

Workflows upload reports from:

- `docs/releases/**`
- `.github/reports/**`

## Branch protection

See [BRANCH-PROTECTION.md](./BRANCH-PROTECTION.md).

## Notifications

Hooks for Slack / Discord / Teams / Email are reserved; delivery is disabled by default.

## Docker

`scripts/release/docker-build.sh` is a scaffold. Deployment remains optional and off by default.
