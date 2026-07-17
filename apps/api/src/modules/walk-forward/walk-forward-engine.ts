import { Injectable } from '@nestjs/common';
import { BacktestEngine } from '../backtesting/backtest-engine';
import type { BacktestSession } from '../backtesting/backtest-session';
import { toBacktestSessionId } from '../backtesting/backtest-session-id';
import { BacktestStatus } from '../backtesting/backtest-status';
import type { Strategy } from '../backtesting/strategy';
import { MarketDataSource } from '../market-data-provider/market-data-source';
import { ProviderRegistry } from '../market-data-provider/provider-registry';
import type { WalkForwardResult, WalkForwardWindowResult } from './walk-forward-result';
import type { WalkForwardSession } from './walk-forward-session';
import { buildWalkForwardWindows } from './walk-forward-window-builder';

/** Inclusive fetch span covering all stored history for window generation. */
const HISTORY_FROM = '1970-01-01T00:00:00.000Z';
const HISTORY_TO = '9999-12-31T23:59:59.999Z';

/**
 * Walk-Forward analysis engine (US119).
 * Splits history into rolling windows and runs BacktestEngine sequentially on each test window.
 * No optimization / paper trading / REST / Prisma.
 */
@Injectable()
export class WalkForwardEngine {
  constructor(
    private readonly providers: ProviderRegistry,
    private readonly backtests: BacktestEngine,
  ) {}

  async run(session: WalkForwardSession, strategy: Strategy): Promise<WalkForwardResult> {
    this.assertSession(session);

    const startedAtMs = Date.now();
    const startedAt = new Date(startedAtMs).toISOString();

    const { bars } = await this.providers.fetchHistorical(MarketDataSource.Local, {
      workspaceId: session.workspaceId,
      instrument: session.instrument,
      timeframe: session.timeframe,
      from: HISTORY_FROM,
      to: HISTORY_TO,
    });

    const ordered = [...bars].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const windows = buildWalkForwardWindows(
      ordered,
      session.trainingWindow,
      session.testingWindow,
      session.stepSize,
    );

    const windowResults: WalkForwardWindowResult[] = [];
    let completedWindows = 0;
    let failedWindows = 0;
    let totalProcessedBars = 0;

    for (const window of windows) {
      const backtestSession = this.toBacktestSession(
        session,
        window.index,
        window.testFrom,
        window.testTo,
      );
      const result = await this.backtests.run(backtestSession, strategy);

      windowResults.push({ window, result });
      totalProcessedBars += result.processedBars;

      if (result.status === BacktestStatus.Completed) {
        completedWindows += 1;
      } else {
        failedWindows += 1;
      }
    }

    const finishedAtMs = Date.now();
    return {
      totalWindows: windows.length,
      completedWindows,
      failedWindows,
      totalProcessedBars,
      startedAt,
      finishedAt: new Date(finishedAtMs).toISOString(),
      durationMs: finishedAtMs - startedAtMs,
      windowResults,
    };
  }

  private toBacktestSession(
    session: WalkForwardSession,
    windowIndex: number,
    from: string,
    to: string,
  ): BacktestSession {
    return {
      id: toBacktestSessionId(`${session.id}-w${windowIndex}`),
      workspaceId: session.workspaceId,
      strategyId: session.strategyId,
      instrument: session.instrument,
      timeframe: session.timeframe,
      from,
      to,
      status: BacktestStatus.Created,
      createdAt: new Date().toISOString(),
    };
  }

  private assertSession(session: WalkForwardSession): void {
    assertNonEmpty(session.workspaceId, 'workspaceId');
    assertNonEmpty(session.strategyId, 'strategyId');
    assertNonEmpty(String(session.instrument), 'instrument');
    assertPositiveInt(session.trainingWindow, 'trainingWindow');
    assertPositiveInt(session.testingWindow, 'testingWindow');
    assertPositiveInt(session.stepSize, 'stepSize');
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}

function assertPositiveInt(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new Error(`${field} must be a positive integer`);
  }
}
