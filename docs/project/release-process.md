# Release Process

Rules for committing and releasing TRP Research OS work.

Related docs:

- Project Status: [`project-status.md`](./project-status.md)
- ADR Index: [`../adr/README.md`](../adr/README.md)
- Version History: [`../research/version-history.md`](../research/version-history.md)
- Changelog: [`../../CHANGELOG.md`](../../CHANGELOG.md)

---

## Commit cadence

- Create a git commit after every **2–4** completed User Stories (or after one large story that is a logical checkpoint).
- Prefer commits that group a coherent slice of work (e.g. Knowledge foundation + tests + docs).
- Never skip hooks unless the user explicitly requests it.
- Do not amend published commits unless the user explicitly requests it and safety rules allow it.

## Push cadence

- Push to remote after every **5–10** completed User Stories, or when a logical stage finishes (e.g. Knowledge Layer frozen, Campaign Layer complete).
- **Do not push automatically.** Push only when the user explicitly asks.

## Documentation updates (required with each User Story)

After each completed User Story:

1. Update `docs/project/project-status.md` (Completed Story, status, Next Step).
2. Update `docs/research/version-history.md` if calculation/validation/knowledge semantics changed.
3. Update `docs/adr/README.md` if a new architectural decision was accepted.
4. Update `CHANGELOG.md` under `[Unreleased]` for user-visible / release-relevant changes.
5. Record for the story, at minimum:
   - Completed Story
   - Changed Files
   - Tests
   - Next Step

## Scope guard — Architecture Review

If implementing a User Story would require changes in **more than three modules**, or clearly exceeds the original story scope:

1. **Stop** implementation.
2. Do **not** expand the change set opportunistically.
3. Produce an **Architecture Review** instead (read-only or proposal-only), describing:
   - why the scope grew;
   - which modules would be touched;
   - minimal recommended options;
   - what should become a new User Story.

Resume coding only after the user accepts a revised scope.

## What not to automate

- No automatic `git push`.
- No automatic production deploy.
- No automatic research campaigns or Knowledge backfill as part of release packaging.
