/**
 * Replay-only metrics for US193 Historical Replay.
 *
 * No trading metrics, PnL, or portfolio figures.
 */

export type ReplayMetrics = Readonly<{
  candlesProcessed: number;
  replayDuration: number;
  cyclesExecuted: number;
  eventsPublished: number;
  errorCount: number;
}>;

export function createReplayMetrics(properties: ReplayMetrics): ReplayMetrics {
  return Object.freeze({
    candlesProcessed: nonNegativeInteger(properties.candlesProcessed, 'candlesProcessed'),
    replayDuration: nonNegativeInteger(properties.replayDuration, 'replayDuration'),
    cyclesExecuted: nonNegativeInteger(properties.cyclesExecuted, 'cyclesExecuted'),
    eventsPublished: nonNegativeInteger(properties.eventsPublished, 'eventsPublished'),
    errorCount: nonNegativeInteger(properties.errorCount, 'errorCount'),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
