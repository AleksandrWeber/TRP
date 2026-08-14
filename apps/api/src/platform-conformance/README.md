# RC-28 — V2 platform conformance (verification catalog)

**Not a Nest module. Not a business domain. Not registered in `AppModule`.**

RC-28 Epic 1 freezes the integration boundaries of already-shipped Version 2
modules. Epic 2 verifies that those surfaces compose on the certified
business-workflow path using existing ports only. Epic 3 verifies sole
ownership and authority classes against the Authority Matrix and Alias
Dictionary (documents unmodified). Epic 4 executes representative end-to-end
scenarios on those same frozen ports. Epic 5 verifies performance stability,
fail-closed resilience, and RC-19…RC-27 compatibility. Epic 6 records
Version 2 certification readiness — still verification only; Validation &
Release remains a separate task.

This directory is an **audit catalog**: constants + tests that compose
existing RC-21…RC-27 boundary descriptors.

Forbidden here:

- new application ports
- new Source of Truth
- new Nest providers
- product behaviour

Product modules must not import this catalog (that would invent a hub).
Tests may import it.
