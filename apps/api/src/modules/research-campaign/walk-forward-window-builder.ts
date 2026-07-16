export type WalkForwardWindow = {
  trainStart: number;
  trainEnd: number;
  testStart: number;
  testEnd: number;
};

/**
 * Build rolling train/test windows using inclusive index ranges.
 * Train length = windowSize; test length = stepSize; windows advance by stepSize.
 * Does not load bars or run experiments — indices only.
 */
export function buildWalkForwardWindows(
  datasetLength: number,
  windowSize: number,
  stepSize: number,
): WalkForwardWindow[] {
  if (!Number.isFinite(windowSize) || windowSize <= 0) {
    throw new Error('windowSize must be a positive number');
  }
  if (!Number.isFinite(stepSize) || stepSize <= 0) {
    throw new Error('stepSize must be a positive number');
  }
  if (!Number.isFinite(datasetLength) || datasetLength <= 0) {
    return [];
  }

  const windows: WalkForwardWindow[] = [];
  let trainStart = 0;

  while (true) {
    const trainEnd = trainStart + windowSize - 1;
    const testStart = trainEnd + 1;
    const testEnd = testStart + stepSize - 1;

    if (testEnd >= datasetLength) {
      break;
    }

    windows.push({ trainStart, trainEnd, testStart, testEnd });
    trainStart += stepSize;
  }

  return windows;
}
