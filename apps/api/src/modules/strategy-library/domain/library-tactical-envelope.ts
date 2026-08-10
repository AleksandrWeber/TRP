/**
 * RC-22 Epic 4 — Library Tactical Envelope (configuration only).
 *
 * Machine-readable approved operational boundaries for a certified StrategyVersion
 * (Tactics Contract Option B / Domain Model Contract §8).
 *
 * This is Strategy Library SoT for envelope bodies.
 * Distinct from the RC-19 Session `tactical-envelope` stub (non-authoritative).
 *
 * NOT trading logic. NOT runtime adaptation. NOT Orchestrator / AI / eligibility.
 */

export type NumericRange = Readonly<{
  min: number;
  max: number;
  step?: number;
}>;

export type DiscreteNumberSet = Readonly<{
  kind: 'set';
  values: readonly number[];
}>;

export type RiskPerTradeLimit = NumericRange | DiscreteNumberSet;

export type MaxPositionsLimit = Readonly<{
  min: number;
  max: number;
}>;

export type ExecutionConstraints = Readonly<{
  maxOrdersPerDay?: number;
  allowedOrderTypes?: readonly string[];
}>;

/**
 * Immutable Library-owned tactical envelope.
 * Describes approved operational limits only.
 */
export type LibraryTacticalEnvelope = Readonly<{
  envelopeVersion: string;
  allowedMarkets: readonly string[];
  allowedExchangeScopeIds: readonly string[];
  allowedSymbols: readonly string[];
  allowedTimeframes: readonly string[];
  riskPerTrade: RiskPerTradeLimit;
  maxPositions: MaxPositionsLimit;
  /** Named parameter limits (configuration bounds — not strategy code). */
  parameterLimits: Readonly<Record<string, NumericRange>>;
  executionConstraints: ExecutionConstraints | null;
  optionalFilters: readonly string[];
  provenanceRefs: readonly string[];
}>;

export type CreateLibraryTacticalEnvelopeInput = Readonly<{
  envelopeVersion: string;
  allowedMarkets: readonly string[];
  allowedExchangeScopeIds: readonly string[];
  allowedSymbols: readonly string[];
  allowedTimeframes: readonly string[];
  riskPerTrade: RiskPerTradeLimit;
  maxPositions: MaxPositionsLimit;
  parameterLimits?: Readonly<Record<string, NumericRange>>;
  executionConstraints?: ExecutionConstraints | null;
  optionalFilters?: readonly string[];
  provenanceRefs?: readonly string[];
}>;

function requiredNonEmptyStrings(values: readonly string[], field: string): readonly string[] {
  if (values.length === 0) {
    throw new Error(`${field} must contain at least one value`);
  }
  const normalized = values.map((v) => {
    const trimmed = v.trim();
    if (!trimmed) {
      throw new Error(`${field} entries must be non-empty`);
    }
    return trimmed;
  });
  return Object.freeze(normalized);
}

function assertFiniteNumber(value: number, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

function freezeNumericRange(range: NumericRange, field: string): NumericRange {
  const min = assertFiniteNumber(range.min, `${field}.min`);
  const max = assertFiniteNumber(range.max, `${field}.max`);
  if (min > max) {
    throw new Error(`${field}.min must be <= ${field}.max`);
  }
  if (range.step !== undefined) {
    const step = assertFiniteNumber(range.step, `${field}.step`);
    if (step <= 0) {
      throw new Error(`${field}.step must be > 0`);
    }
    return Object.freeze({ min, max, step });
  }
  return Object.freeze({ min, max });
}

function freezeRiskPerTrade(limit: RiskPerTradeLimit): RiskPerTradeLimit {
  if ('kind' in limit && limit.kind === 'set') {
    if (limit.values.length === 0) {
      throw new Error('riskPerTrade set must contain at least one value');
    }
    return Object.freeze({
      kind: 'set' as const,
      values: Object.freeze(
        limit.values.map((v, i) => assertFiniteNumber(v, `riskPerTrade.values[${i}]`)),
      ),
    });
  }
  return freezeNumericRange(limit as NumericRange, 'riskPerTrade');
}

function freezeParameterLimits(
  limits: Readonly<Record<string, NumericRange>> | undefined,
): Readonly<Record<string, NumericRange>> {
  if (!limits) {
    return Object.freeze({});
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(limits).map(([key, range]) => {
        const trimmed = key.trim();
        if (!trimmed) {
          throw new Error('parameterLimits keys must be non-empty');
        }
        return [trimmed, freezeNumericRange(range, `parameterLimits.${trimmed}`)];
      }),
    ),
  );
}

function freezeExecutionConstraints(
  constraints: ExecutionConstraints | null | undefined,
): ExecutionConstraints | null {
  if (constraints === undefined || constraints === null) {
    return null;
  }
  const result: {
    maxOrdersPerDay?: number;
    allowedOrderTypes?: readonly string[];
  } = {};
  if (constraints.maxOrdersPerDay !== undefined) {
    const n = assertFiniteNumber(
      constraints.maxOrdersPerDay,
      'executionConstraints.maxOrdersPerDay',
    );
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('executionConstraints.maxOrdersPerDay must be a non-negative integer');
    }
    result.maxOrdersPerDay = n;
  }
  if (constraints.allowedOrderTypes !== undefined) {
    result.allowedOrderTypes = requiredNonEmptyStrings(
      constraints.allowedOrderTypes,
      'executionConstraints.allowedOrderTypes',
    );
  }
  return Object.freeze(result);
}

/**
 * Create an immutable Library Tactical Envelope (configuration only).
 * No runtime behaviour / optimisation / execution.
 */
export function createLibraryTacticalEnvelope(
  input: CreateLibraryTacticalEnvelopeInput,
): LibraryTacticalEnvelope {
  const envelopeVersion = input.envelopeVersion.trim();
  if (!envelopeVersion) {
    throw new Error('envelopeVersion is required');
  }

  const maxPositions = freezeNumericRange(
    { min: input.maxPositions.min, max: input.maxPositions.max },
    'maxPositions',
  );

  return Object.freeze({
    envelopeVersion,
    allowedMarkets: requiredNonEmptyStrings(input.allowedMarkets, 'allowedMarkets'),
    allowedExchangeScopeIds: requiredNonEmptyStrings(
      input.allowedExchangeScopeIds,
      'allowedExchangeScopeIds',
    ),
    allowedSymbols: requiredNonEmptyStrings(input.allowedSymbols, 'allowedSymbols'),
    allowedTimeframes: requiredNonEmptyStrings(input.allowedTimeframes, 'allowedTimeframes'),
    riskPerTrade: freezeRiskPerTrade(input.riskPerTrade),
    maxPositions: Object.freeze({ min: maxPositions.min, max: maxPositions.max }),
    parameterLimits: freezeParameterLimits(input.parameterLimits),
    executionConstraints: freezeExecutionConstraints(input.executionConstraints),
    optionalFilters: Object.freeze(
      (input.optionalFilters ?? []).map((f) => {
        const trimmed = f.trim();
        if (!trimmed) {
          throw new Error('optionalFilters entries must be non-empty');
        }
        return trimmed;
      }),
    ),
    provenanceRefs: Object.freeze(
      (input.provenanceRefs ?? []).map((r) => {
        const trimmed = r.trim();
        if (!trimmed) {
          throw new Error('provenanceRefs entries must be non-empty');
        }
        return trimmed;
      }),
    ),
  });
}

export function libraryTacticalEnvelopeIsImmutable(envelope: LibraryTacticalEnvelope): true {
  if (!Object.isFrozen(envelope)) {
    throw new Error('LibraryTacticalEnvelope must be immutable');
  }
  return true;
}

/**
 * In-place envelope mutation is forbidden.
 * A new envelope requires a new certification (and typically a new StrategyVersion).
 */
export function replaceLibraryTacticalEnvelopeInPlace(
  _envelope: LibraryTacticalEnvelope,
  _next: CreateLibraryTacticalEnvelopeInput,
): never {
  throw new Error(
    'Tactical Envelope is immutable; changing an envelope requires a new certification',
  );
}
