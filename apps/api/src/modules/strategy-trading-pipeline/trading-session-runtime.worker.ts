import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OutboxDispatcher, type DurableEventEnvelope } from '../event-processing';
import { isTimeframe } from '../market-data/timeframe';
import {
  BINANCE_SPOT_SOURCE_ID,
  LIVE_MARKET_CONNECTOR_REGISTRY,
  MarketStreamChannel,
  MarketSubscriptionRegistry,
  subscriptionIdFor,
  type LiveMarketConnectorRegistry,
} from '../live-market-data';
import { ReportNarrativeConsumerService, ReportNotificationConsumerService } from '../product-flow';
import { createReportDefinition } from '../reporting/domain/report-definition';
import { CLOSED_CANDLE_TICK_EVENT_TYPE, type EvaluationCandleInput } from '../strategy-runtime';
import { PipelineCommandAssembler } from './pipeline-command.assembler';
import {
  StrategyTradingPipelineService,
  type StrategyTradingPipelineResult,
} from './strategy-trading-pipeline.service';

export const TRADING_SESSION_RUNTIME_CONSUMER_ID = 'v2-trading-session-runtime';

const RUNTIME_ACTOR = 'trading-session-runtime-worker';

/**
 * Trading Session Runtime Worker — production driver of the existing pipeline.
 *
 * Event-driven: Closed Candle (and session start/stop) outbox events only.
 * Does not poll. Does not replace RuntimeEvaluationService or the pipeline.
 */
@Injectable()
export class TradingSessionRuntimeWorker implements OnModuleInit {
  private readonly logger = new Logger(TradingSessionRuntimeWorker.name);

  constructor(
    @Inject(OutboxDispatcher)
    private readonly dispatcher: OutboxDispatcher,
    @Inject(PipelineCommandAssembler)
    private readonly assembler: PipelineCommandAssembler,
    @Inject(StrategyTradingPipelineService)
    private readonly pipeline: StrategyTradingPipelineService,
    @Inject(MarketSubscriptionRegistry)
    private readonly subscriptions: MarketSubscriptionRegistry,
    @Inject(LIVE_MARKET_CONNECTOR_REGISTRY)
    private readonly connectors: LiveMarketConnectorRegistry,
    @Inject(ReportNarrativeConsumerService)
    private readonly narratives: ReportNarrativeConsumerService,
    @Inject(ReportNotificationConsumerService)
    private readonly notifications: ReportNotificationConsumerService,
  ) {}

  onModuleInit(): void {
    this.dispatcher.register({
      consumerId: TRADING_SESSION_RUNTIME_CONSUMER_ID,
      handle: (event) => this.handle(event),
    });
  }

  async handle(event: DurableEventEnvelope): Promise<void> {
    if (event.eventType === 'TradingSessionStarted') {
      await this.subscribeSession(event);
      return;
    }
    if (event.eventType === 'TradingSessionStopped' || event.eventType === 'TradingSessionFailed') {
      await this.unsubscribeSession(event);
      return;
    }
    if (event.eventType !== CLOSED_CANDLE_TICK_EVENT_TYPE) {
      return;
    }
    await this.dispatchClosedCandle(event);
  }

  private async dispatchClosedCandle(event: DurableEventEnvelope): Promise<void> {
    const candle = toEvaluationCandle(event);
    if (!candle) return;
    const nowIso = event.recordedAt;
    const sessions = await this.assembler.listArmedStrategySessions();
    for (const session of sessions) {
      if (session.workspaceId !== candle.workspaceId) continue;
      try {
        const deployment = await this.assembler.loadDeployment(
          session.workspaceId,
          session.deploymentId,
        );
        if (!deployment) continue;
        if (!this.assembler.candleMatchesDeployment(candle, deployment)) continue;
        if (!(await this.assembler.canEvaluate(session))) continue;
        const command = await this.assembler.assemble({
          session,
          deployment,
          event: candle,
          nowIso,
          recordedAt: event.recordedAt,
          actorId: RUNTIME_ACTOR,
          correlationId: event.eventId,
        });
        const result = await this.pipeline.run(command);
        if (result.outcome === 'filled') {
          this.afterFill(
            session.workspaceId,
            session.id,
            session.actorId,
            candle,
            event.recordedAt,
            result,
          );
        }
      } catch (error) {
        this.logger.error(
          `runtime worker failed for session ${session.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private afterFill(
    workspaceId: string,
    sessionId: string,
    userId: string,
    candle: EvaluationCandleInput,
    recordedAt: string,
    result: StrategyTradingPipelineResult,
  ): void {
    const reportRunId = `runtime-paper:${sessionId}:${candle.eventId}`;
    const window = reportWindow(candle.openTime, recordedAt);
    const definition = createReportDefinition({
      reportDefinitionId: `runtime-paper-ops:${sessionId}`,
      workspaceId,
      name: 'Paper session ops',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count', 'session_activity'],
      createdAt: recordedAt,
    });
    try {
      this.narratives.requestAndNarrate({
        workspaceId,
        definition,
        window,
        modes: ['paper'],
        tradingSessionId: sessionId,
        requestedBy: userId,
        requestedAt: recordedAt,
        reportRunId,
        focus: result.order?.id ?? sessionId,
      });
    } catch (error) {
      this.logger.warn(
        `runtime reporting/AI skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      this.notifications.requestAndDeliver({
        workspaceId,
        userId,
        definition,
        window,
        modes: ['paper'],
        tradingSessionId: sessionId,
        requestedBy: userId,
        requestedAt: recordedAt,
        reportRunId,
      });
    } catch (error) {
      this.logger.warn(
        `runtime notification skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async subscribeSession(event: DurableEventEnvelope): Promise<void> {
    if (event.payload.origin !== 'strategy') return;
    const sessionId = requiredPayload(event.payload.sessionId, 'sessionId');
    const workspaceId = event.workspaceId;
    const sessions = await this.assembler.listArmedStrategySessions();
    const session = sessions.find((row) => row.id === sessionId && row.workspaceId === workspaceId);
    const deploymentId = requiredPayload(
      event.payload.deploymentId ?? session?.deploymentId,
      'deploymentId',
    );
    const deployment = await this.assembler.loadDeployment(workspaceId, deploymentId);
    if (!deployment || !isTimeframe(deployment.timeframe)) return;
    const at = event.recordedAt;
    await this.subscriptions.subscribe(
      {
        workspaceId,
        sourceId: BINANCE_SPOT_SOURCE_ID,
        instrument: deployment.instrument,
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe: deployment.timeframe,
      },
      at,
    );
    if (!this.connectors.has(BINANCE_SPOT_SOURCE_ID)) return;
    try {
      const connector = this.connectors.resolve(BINANCE_SPOT_SOURCE_ID);
      await connector.subscribe({
        workspaceId,
        instrument: deployment.instrument,
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe: deployment.timeframe,
      });
    } catch (error) {
      this.logger.warn(
        `market connector subscribe skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async unsubscribeSession(event: DurableEventEnvelope): Promise<void> {
    if (event.payload.origin !== 'strategy') return;
    const workspaceId = event.workspaceId;
    const deploymentId = event.payload.deploymentId;
    if (typeof deploymentId !== 'string' || deploymentId.trim() === '') return;
    const deployment = await this.assembler.loadDeployment(workspaceId, deploymentId);
    if (!deployment || !isTimeframe(deployment.timeframe)) return;
    const command = {
      workspaceId,
      sourceId: BINANCE_SPOT_SOURCE_ID,
      instrument: deployment.instrument,
      channel: MarketStreamChannel.CLOSED_CANDLE,
      timeframe: deployment.timeframe,
    } as const;
    await this.subscriptions.unsubscribe(workspaceId, subscriptionIdFor(command), event.recordedAt);
  }
}

function toEvaluationCandle(event: DurableEventEnvelope): EvaluationCandleInput | null {
  const payload = event.payload;
  const instrument = payload.instrument;
  const timeframe = payload.timeframe;
  const openTime = payload.openTime;
  const closeTime = payload.closeTime;
  if (
    typeof instrument !== 'string' ||
    typeof timeframe !== 'string' ||
    typeof openTime !== 'string' ||
    typeof closeTime !== 'string'
  ) {
    return null;
  }
  return {
    eventType: CLOSED_CANDLE_TICK_EVENT_TYPE,
    eventId: event.eventId,
    workspaceId: event.workspaceId,
    streamId: event.aggregateId,
    sequence: event.aggregateVersion,
    openTime,
    closeTime,
    instrument,
    timeframe,
    open: asNumber(payload.open),
    high: asNumber(payload.high),
    low: asNumber(payload.low),
    close: asNumber(payload.close),
    volume: asNumber(payload.volume),
  };
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error('closed candle OHLC/V must be numeric');
}

function requiredPayload(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required`);
  }
  return value;
}

function reportWindow(from: string, recordedAt: string): { from: string; to: string } {
  const start = Date.parse(from);
  const end = Date.parse(recordedAt);
  const to = Number.isFinite(end) ? new Date(end + 1000).toISOString() : recordedAt;
  if (Number.isFinite(start) && start < Date.parse(to)) {
    return { from, to };
  }
  return { from: new Date(Date.parse(to) - 86_400_000).toISOString(), to };
}
