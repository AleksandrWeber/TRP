import { PrismaClient } from '@prisma/client';
import { performance } from 'node:perf_hooks';
import { M2_PAPER_FILL_CONFIGURATION, matchPaperOrder } from '../../modules/execution-adapter';

export type M2BaselineSize = 'small' | 'medium' | 'practical_limit';

export type M2BaselineResult = Readonly<{
  size: M2BaselineSize;
  events: number;
  deterministicFills: number;
  durationMs: number;
  eventsPerSec: number;
  heapDeltaMb: number;
  maxConsumerLagMs: number;
  transactionSamples: number;
  averageTransactionMs: number;
  p95TransactionMs: number;
}>;

export const M2_BASELINE_LIMITS = Object.freeze({
  mediumMaxDurationMs: 10_000,
  mediumMinEventsPerSec: 500,
  practicalMaxHeapDeltaMb: 128,
  practicalMaxConsumerLagMs: 1_000,
  transactionP95Ms: 250,
});

const scenarios = Object.freeze({
  small: { events: 100, transactionSamples: 5 },
  medium: { events: 1_000, transactionSamples: 15 },
  practical_limit: { events: 5_000, transactionSamples: 30 },
});

export async function runM2PerformanceBaseline(size: M2BaselineSize): Promise<M2BaselineResult> {
  const scenario = scenarios[size];
  const beforeHeap = process.memoryUsage().heapUsed;
  const queue: Array<{ sequence: number; enqueuedAt: number }> = [];
  let deterministicFills = 0;
  let maxConsumerLagMs = 0;
  const startedAt = performance.now();

  for (let sequence = 1; sequence <= scenario.events; sequence += 1) {
    queue.push({ sequence, enqueuedAt: performance.now() });
    if (queue.length === 100 || sequence === scenario.events) {
      for (const item of queue.splice(0)) {
        maxConsumerLagMs = Math.max(maxConsumerLagMs, performance.now() - item.enqueuedAt);
        const input = {
          adapterOrderId: `baseline-order-${item.sequence}`,
          executionContextHash: `baseline-context-${item.sequence}`,
          instrument: 'BTCUSDT',
          side: 'buy' as const,
          type: 'market' as const,
          quantity: '1.25',
          limitPrice: null,
          referencePrice: '100.125',
          occurredAt: '2026-07-18T21:10:00.000Z',
          configuration: M2_PAPER_FILL_CONFIGURATION,
        };
        const first = matchPaperOrder(input);
        const replay = matchPaperOrder(input);
        if (first.outcome !== 'filled' || replay.outcome !== 'filled') {
          throw new Error('M2 baseline expected deterministic market Fill');
        }
        if (JSON.stringify(first.fill) !== JSON.stringify(replay.fill)) {
          throw new Error('M2 baseline deterministic replay mismatch');
        }
        deterministicFills += 1;
      }
    }
  }
  const durationMs = performance.now() - startedAt;
  const heapDeltaMb = (process.memoryUsage().heapUsed - beforeHeap) / 1024 / 1024;
  const transactionLatencies = await sampleTransactions(scenario.transactionSamples);
  const sorted = [...transactionLatencies].sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);

  return Object.freeze({
    size,
    events: scenario.events,
    deterministicFills,
    durationMs: round(durationMs),
    eventsPerSec: round((scenario.events / durationMs) * 1_000),
    heapDeltaMb: round(heapDeltaMb),
    maxConsumerLagMs: round(maxConsumerLagMs),
    transactionSamples: scenario.transactionSamples,
    averageTransactionMs: round(
      transactionLatencies.reduce((total, latency) => total + latency, 0) /
        transactionLatencies.length,
    ),
    p95TransactionMs: round(sorted[p95Index] ?? 0),
  });
}

async function sampleTransactions(samples: number): Promise<number[]> {
  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const latencies: number[] = [];
    for (let sample = 0; sample < samples; sample += 1) {
      const startedAt = performance.now();
      await prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT 1`;
      });
      latencies.push(performance.now() - startedAt);
    }
    return latencies;
  } finally {
    await prisma.$disconnect();
  }
}

function round(value: number): number {
  return Number(value.toFixed(3));
}
