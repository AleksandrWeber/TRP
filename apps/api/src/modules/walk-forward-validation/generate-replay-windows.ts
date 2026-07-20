import type { HistoricalDataset } from '../historical-replay';
import { createReplayWindow, type ReplayWindow } from './replay-window';
import {
  walkForwardWindowLength,
  type WalkForwardConfiguration,
} from './walk-forward-configuration';

/**
 * Deterministic ReplayWindow generation for US194.
 *
 * Each window covers [start, start + trainingWindow + validationWindow - 1].
 * Windows advance by stepSize. Generation stops at maximumWindows or when the
 * next window would exceed the dataset.
 */
export function generateReplayWindows(
  dataset: HistoricalDataset,
  configuration: WalkForwardConfiguration,
): readonly ReplayWindow[] {
  if (dataset.candles.length === 0) {
    throw new Error('dataset must not be empty');
  }
  if (configuration.datasetId !== dataset.datasetId) {
    throw new Error(`configuration datasetId mismatch: ${configuration.datasetId}`);
  }

  const windowLength = walkForwardWindowLength(configuration);
  const windows: ReplayWindow[] = [];
  let startIndex = 0;

  while (windows.length < configuration.maximumWindows) {
    const endIndex = startIndex + windowLength - 1;
    if (endIndex >= dataset.candles.length) {
      break;
    }

    windows.push(
      createReplayWindow({
        windowId: `window-${windows.length}`,
        startIndex,
        endIndex,
        datasetId: configuration.datasetId,
      }),
    );

    startIndex += configuration.stepSize;
  }

  if (windows.length === 0) {
    throw new Error('zero windows generated for walk forward configuration');
  }

  assertOverlapPolicy(windows, configuration.overlap);

  return Object.freeze(windows);
}

function assertOverlapPolicy(windows: readonly ReplayWindow[], configuredOverlap: number): void {
  for (let index = 1; index < windows.length; index += 1) {
    const previous = windows[index - 1] as ReplayWindow;
    const current = windows[index] as ReplayWindow;
    const overlap = Math.max(0, previous.endIndex - current.startIndex + 1);

    if (configuredOverlap === 0 && overlap > 0) {
      throw new Error('windows must not overlap when overlap is 0');
    }
    if (configuredOverlap > 0 && overlap !== configuredOverlap) {
      throw new Error(`window overlap mismatch: expected ${configuredOverlap}, got ${overlap}`);
    }
  }
}
