# Engineering Release Pipeline (RC-2)

Automated release certification for Trading Platform V1.

## Command

```bash
pnpm release:rc
```

CI / validation-only (no commit/tag):

```bash
pnpm release:validate
# or
pnpm release:rc -- --no-git
```

## Stages

1. Repository Validation
2. Dependency Validation
3. Static Analysis (`lint`, `typecheck`, `format:check`)
4. Production Build
5. Database Validation (`prisma generate`, `migrate deploy`)
6. Automated Tests
7. Architecture Validation
8. Smoke Tests
9. Performance Smoke
10. Security Validation
11. Documentation Validation
12. Release Notes Generation
13. Certification Generation
14. Git Commit + Tag (**only if FINAL RESULT == PASS**)

Fail-fast: any critical phase failure stops the pipeline, writes partial reports, exits non-zero, and skips commit/tag.

## Reports

Written under `docs/releases/rc-<N>/` plus:

- `docs/releases/RC-<N>-RELEASE-NOTES.md`
- `docs/releases/RC-<N>-CERTIFICATION.md`

## Components

| Module                   | Role                                       |
| ------------------------ | ------------------------------------------ |
| `RepositoryValidator`    | Git integrity / leftovers                  |
| `DependencyValidator`    | Install + lockfile                         |
| `StaticAnalysisRunner`   | Lint / types / format                      |
| `BuildValidator`         | Web / API / shared builds                  |
| `DatabaseValidator`      | Prisma generate + migrate                  |
| `TestRunner`             | Full vitest suite                          |
| `ArchitectureValidator`  | Order→Risk→… invariants                    |
| `SmokeRunner`            | Focused functional suites                  |
| `PerformanceRunner`      | Lightweight load + benchmark               |
| `SecurityValidator`      | Secrets / JWT / Helmet / CORS / rate limit |
| `DocumentationValidator` | Required docs inventory                    |
| `ReleaseNotesGenerator`  | Release notes                              |
| `CertificationGenerator` | Scorecard certificate                      |
| `GitReleaseManager`      | Commit + tag (PASS only)                   |
| `ReleasePipeline`        | Orchestrator                               |

## Environment

| Variable             | Meaning                         |
| -------------------- | ------------------------------- |
| `RELEASE_RC_VERSION` | RC number (default `1`)         |
| `RELEASE_TAG`        | Tag name (default `v1.0.0-rc1`) |
| `RELEASE_SKIP_GIT=1` | Skip commit/tag                 |
| `CI=true`            | Also skips git by default       |
