export function calculateEma(values: number[], period: number): number[] {
  if (period <= 0) {
    throw new Error('EMA period must be positive');
  }
  if (values.length === 0) {
    return [];
  }

  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = values[0];
  result.push(ema);

  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result.push(ema);
  }

  return result;
}
