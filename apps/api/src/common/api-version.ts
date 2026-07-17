/**
 * API URI versioning (US114).
 *
 * Nest enables `VersioningType.URI` in `main.ts`.
 * Controllers declare version via `@Controller({ path, version: API_VERSION })`
 * which mounts routes under `/v1/...`.
 *
 * Note: Nest's `@Version()` decorator is method-scoped (not class-scoped);
 * class-level versioning uses the Controller `version` option (same URI result).
 *
 * Health / app root use `VERSION_NEUTRAL` (unversioned).
 */
export const API_VERSION = '1';
