import { createHash } from 'node:crypto';
import type { OhlcvBar } from './types';

export function hashBars(bars: OhlcvBar[]): string {
  const payload = bars
    .map((b) => `${b.timestamp}|${b.open}|${b.high}|${b.low}|${b.close}|${b.volume}`)
    .join('\n');
  return createHash('sha256').update(payload).digest('hex');
}

export function hashConfig(config: unknown): string {
  return createHash('sha256').update(JSON.stringify(config)).digest('hex');
}
