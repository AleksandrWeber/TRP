export type QueryNormalizationFailure = Readonly<{
  ok: false;
  code: 'parameter_pollution';
  field: string;
}>;

export type QueryNormalizationSuccess = Readonly<{
  ok: true;
  query: Record<string, string | string[]>;
}>;

export type QueryNormalizationResult = QueryNormalizationFailure | QueryNormalizationSuccess;

function toStringValues(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => toStringValues(item));
  }
  return [String(value)];
}

/**
 * Collapse duplicate query parameters and reject conflicting values (HPP foundation).
 */
export function normalizeIncomingQuery(query: Record<string, unknown>): QueryNormalizationResult {
  const normalized: Record<string, string | string[]> = {};

  for (const [field, rawValue] of Object.entries(query)) {
    const values = toStringValues(rawValue);
    if (values.length === 0) continue;

    const unique = [...new Set(values)];
    if (unique.length > 1) {
      return { ok: false, code: 'parameter_pollution', field };
    }

    normalized[field] = unique[0]!;
  }

  return { ok: true, query: normalized };
}

export const PARAMETER_POLLUTION_MESSAGE = 'Conflicting duplicate query parameters are not allowed';
