/**
 * Structural checks for research payloads read back during Prisma hydration.
 * Validators throw a plain Error. `readHydratedPayload` attaches the repository and record id.
 * Field messages name the path and the expected type. They do not include payload values.
 */
export class HydrationPayloadError extends Error {
  readonly repositoryName: string;
  readonly recordId: string;

  constructor(repositoryName: string, recordId: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : 'invalid payload';
    super(
      `Research repository "${repositoryName}" record "${recordId}" has an invalid payload: ${detail}`,
    );
    this.name = 'HydrationPayloadError';
    this.repositoryName = repositoryName;
    this.recordId = recordId;
    this.cause = cause;
  }
}

export function readHydratedPayload<T>(
  repositoryName: string,
  recordId: string,
  payload: unknown,
  validate: (payload: unknown) => T,
): T {
  try {
    return validate(payload);
  } catch (error) {
    if (error instanceof HydrationPayloadError) throw error;
    throw new HydrationPayloadError(repositoryName, recordId, error);
  }
}

export function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requireString(source: Record<string, unknown>, key: string, field = key): string {
  const value = source[key];
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  return value;
}

export function requireNonEmptyString(
  source: Record<string, unknown>,
  key: string,
  field = key,
): string {
  const value = requireString(source, key, field);
  if (value.length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

export function assertOptionalString(
  source: Record<string, unknown>,
  key: string,
  field = key,
): void {
  if (source[key] === undefined) return;
  if (typeof source[key] !== 'string') {
    throw new Error(`${field} must be a string when present`);
  }
}

export function requireStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${field} must be a string array`);
  }
}

export function assertOptionalStringArray(
  source: Record<string, unknown>,
  key: string,
  field = key,
): void {
  if (source[key] === undefined) return;
  requireStringArray(source[key], field);
}

export function requireNumber(source: Record<string, unknown>, key: string, field = key): void {
  const value = source[key];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${field} must be a number`);
  }
}

export function requireNullableNumber(
  source: Record<string, unknown>,
  key: string,
  field = key,
): void {
  const value = source[key];
  if (value === null) return;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${field} must be a number or null`);
  }
}

export function assertOptionalNumber(
  source: Record<string, unknown>,
  key: string,
  field = key,
): void {
  if (source[key] === undefined) return;
  requireNumber(source, key, field);
}

export function requireNullableString(
  source: Record<string, unknown>,
  key: string,
  field = key,
): void {
  const value = source[key];
  if (value === null) return;
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string or null`);
  }
}

export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): void {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${field} must be one of: ${allowed.join(', ')}`);
  }
}

export function requireEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): void {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }
  value.forEach((item, index) => {
    requireEnum(item, allowed, `${field}[${index}]`);
  });
}

export function assertMatchesStoredId(actual: string, storedId: string, field: string): void {
  if (actual !== storedId) {
    throw new Error(`${field} must match the stored record id`);
  }
}
