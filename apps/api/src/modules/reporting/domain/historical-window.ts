/**
 * RC-24 Epic 3 — HistoricalWindow (parameter object).
 *
 * Domain Model Contract §5.
 * Not a Source of Truth entity. Window selection never authorizes trading.
 */

import {
  HISTORICAL_WINDOW_PRESETS,
  assertIsoTimestamp,
  deepFreeze,
  type HistoricalWindowPreset,
} from './reporting-domain-shared';

export type HistoricalWindow = Readonly<{
  preset?: HistoricalWindowPreset;
  /** Inclusive lower bound. */
  from: string;
  /** Exclusive upper bound. */
  to: string;
  /** Display/bucket timezone — non-authoritative. */
  timezone?: string;
}>;

export type CreateHistoricalWindowInput = Readonly<{
  preset?: string;
  from: string;
  to: string;
  timezone?: string;
}>;

/**
 * Create an immutable HistoricalWindow.
 * Does not authorize trading. Does not materialize report runs.
 */
export function createHistoricalWindow(input: CreateHistoricalWindowInput): HistoricalWindow {
  const from = assertIsoTimestamp(input.from, 'from');
  const to = assertIsoTimestamp(input.to, 'to');
  if (Date.parse(from) >= Date.parse(to)) {
    throw new Error('from must be strictly before to');
  }

  let preset: HistoricalWindowPreset | undefined;
  if (input.preset !== undefined && input.preset !== null && input.preset.trim() !== '') {
    const candidate = input.preset.trim();
    if (!(HISTORICAL_WINDOW_PRESETS as readonly string[]).includes(candidate)) {
      throw new Error(`preset must be one of: ${HISTORICAL_WINDOW_PRESETS.join(', ')}`);
    }
    preset = candidate as HistoricalWindowPreset;
  }

  if (preset === 'custom' && (!input.from || !input.to)) {
    throw new Error('custom preset requires explicit from/to');
  }

  const timezone =
    input.timezone !== undefined && input.timezone.trim() !== ''
      ? input.timezone.trim()
      : undefined;

  return deepFreeze({
    ...(preset !== undefined ? { preset } : {}),
    from,
    to,
    ...(timezone !== undefined ? { timezone } : {}),
  });
}
