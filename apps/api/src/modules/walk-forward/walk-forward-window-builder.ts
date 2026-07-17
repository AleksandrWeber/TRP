import type { MarketBar } from '../market-data/market-bar';
import type { WalkForwardWindow } from './walk-forward-window';

/**
 * Build rolling train/test windows over an ascending bar series (US119).
 * Train length = trainingWindow; test length = testingWindow; advance by stepSize.
 * Indices only — no optimization.
 */
export function buildWalkForwardWindows(
  bars: readonly MarketBar[],
  trainingWindow: number,
  testingWindow: number,
  stepSize: number,
): WalkForwardWindow[] {
  assertPositiveInt(trainingWindow, 'trainingWindow');
  assertPositiveInt(testingWindow, 'testingWindow');
  assertPositiveInt(stepSize, 'stepSize');

  if (bars.length === 0) return [];

  const windows: WalkForwardWindow[] = [];
  let trainStart = 0;
  let index = 0;

  while (true) {
    const trainEnd = trainStart + trainingWindow - 1;
    const testStart = trainEnd + 1;
    const testEnd = testStart + testingWindow - 1;

    if (testEnd >= bars.length) {
      break;
    }

    const trainFromBar = bars[trainStart]!;
    const trainToBar = bars[trainEnd]!;
    const testFromBar = bars[testStart]!;
    const testToBar = bars[testEnd]!;

    windows.push({
      index,
      trainFrom: trainFromBar.timestamp,
      trainTo: trainToBar.timestamp,
      testFrom: testFromBar.timestamp,
      testTo: testToBar.timestamp,
    });

    index += 1;
    trainStart += stepSize;
  }

  return windows;
}

function assertPositiveInt(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new Error(`${field} must be a positive integer`);
  }
}
