export function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed === '') {
    throw new Error(`${field} must not be empty`);
  }
  return trimmed;
}

export function assertFiniteNumber(value: number, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

export function assertPositiveNumber(value: number, field: string): number {
  const n = assertFiniteNumber(value, field);
  if (n <= 0) {
    throw new Error(`${field} must be greater than zero`);
  }
  return n;
}

export function assertNonNegativeInteger(value: number, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

export function assertIso8601(value: string, field: string): string {
  const trimmed = assertNonEmpty(value, field);
  if (Number.isNaN(Date.parse(trimmed))) {
    throw new Error(`${field} must be a valid ISO-8601 datetime`);
  }
  return trimmed;
}

export function freezeDeep<T extends object>(value: T): Readonly<T> {
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === 'object') {
      freezeDeep(child as object);
    }
  }
  return Object.freeze(value);
}
