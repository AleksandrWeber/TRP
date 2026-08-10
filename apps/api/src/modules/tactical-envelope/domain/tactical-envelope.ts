/**
 * RC-19 Epic 3 — Tactical Envelope schema stub.
 *
 * Immutable configuration contract attached optionally to a Trading Session.
 * Represents validated operational limits for *future* tactical adjustments.
 *
 * NOT a strategy.
 * NOT a runtime decision engine.
 * NOT AI.
 * NOT Trading Orchestrator.
 *
 * Runtime MUST ignore this field completely until RC-22 enforcement.
 * Status: **Tactical Envelope exists but is not yet active.**
 */

export type ParameterRangeStub = Readonly<{
  min?: number;
  max?: number;
  step?: number;
}>;

/**
 * Canonical structural shape only. No validation, optimisation, or policy.
 * Fields mirror the Tactics Contract / Spec examples for future use.
 */
export type TacticalEnvelope = Readonly<{
  timeframe?: string;
  allowedStrategyVersion?: string;
  allowedParameterRanges?: Readonly<Record<string, ParameterRangeStub>>;
  riskProfileReference?: string;
  /** Tactics Contract shape placeholders (structure only). */
  allowedSymbols?: readonly string[];
  allowedTimeframes?: readonly string[];
}>;

/**
 * Builds an immutable Tactical Envelope value object.
 * Structural freeze only — no business rules.
 */
export function createTacticalEnvelope(input: TacticalEnvelope = {}): TacticalEnvelope {
  return freezeEnvelope(input);
}

/**
 * Structural parse for persistence round-trip.
 * Returns null when absent. Does not validate envelope semantics.
 */
export function parseTacticalEnvelope(value: unknown): TacticalEnvelope | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('tactical envelope must be a JSON object when present');
  }
  return freezeEnvelope(value as TacticalEnvelope);
}

/**
 * Plain JSON suitable for Prisma Json persistence.
 */
export function serializeTacticalEnvelope(
  envelope: TacticalEnvelope | null,
): Record<string, unknown> | null {
  if (envelope === null) {
    return null;
  }
  return structuredClone(envelope) as Record<string, unknown>;
}

function freezeEnvelope(input: TacticalEnvelope): TacticalEnvelope {
  const ranges = input.allowedParameterRanges
    ? Object.freeze(
        Object.fromEntries(
          Object.entries(input.allowedParameterRanges).map(([key, range]) => [
            key,
            Object.freeze({ ...range }),
          ]),
        ),
      )
    : undefined;

  return Object.freeze({
    ...(input.timeframe !== undefined ? { timeframe: input.timeframe } : {}),
    ...(input.allowedStrategyVersion !== undefined
      ? { allowedStrategyVersion: input.allowedStrategyVersion }
      : {}),
    ...(ranges !== undefined ? { allowedParameterRanges: ranges } : {}),
    ...(input.riskProfileReference !== undefined
      ? { riskProfileReference: input.riskProfileReference }
      : {}),
    ...(input.allowedSymbols !== undefined
      ? { allowedSymbols: Object.freeze([...input.allowedSymbols]) }
      : {}),
    ...(input.allowedTimeframes !== undefined
      ? { allowedTimeframes: Object.freeze([...input.allowedTimeframes]) }
      : {}),
  });
}
