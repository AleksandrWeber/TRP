import { Inject, Injectable } from '@nestjs/common';
import { isActiveLiveSessionStatus } from './domain/session-status';
import type { LiveSession } from './domain/live-session';
import { ConnectionSupervisor } from './connection-supervisor';
import { LiveEventPublisher } from './live-event-publisher';
import { LiveSessionManager } from './live-session-manager';
import { SynchronizationManager } from './synchronization-manager';

export type LiveHealthReport = Readonly<{
  sessionId: string | null;
  status: string | null;
  heartbeat: string | null;
  heartbeatLost: boolean;
  websocketLatencyMs: number | null;
  restLatencyMs: number | null;
  reconnectCount: number;
  synchronizationState: string | null;
  synchronizationDelayMs: number | null;
  orderAcknowledgementDelayMs: number | null;
  healthy: boolean;
  alerts: readonly LiveAlert[];
  sampledAt: string;
}>;

export type LiveAlert = Readonly<{
  type:
    | 'connection_lost'
    | 'reconnecting'
    | 'exchange_unavailable'
    | 'synchronization_failed'
    | 'heartbeat_timeout'
    | 'rejected_orders'
    | 'risk_rejections'
    | 'kill_switch_active';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  sessionId: string | null;
}>;

export type LiveWorkspaceHealth = Readonly<{
  sessions: readonly LiveHealthReport[];
  alerts: readonly LiveAlert[];
  healthy: boolean;
  sampledAt: string;
}>;

const HEARTBEAT_TIMEOUT_MS = 30_000;

/**
 * HealthMonitor — operational health for live trading sessions (US210).
 */
@Injectable()
export class HealthMonitor {
  private orderAckDelays = new Map<string, number>();

  constructor(
    @Inject(LiveSessionManager) private readonly sessions: LiveSessionManager,
    @Inject(ConnectionSupervisor) private readonly connections: ConnectionSupervisor,
    @Inject(SynchronizationManager) private readonly sync: SynchronizationManager,
    @Inject(LiveEventPublisher) private readonly events: LiveEventPublisher,
  ) {}

  recordOrderAcknowledgementDelay(sessionId: string, delayMs: number): void {
    this.orderAckDelays.set(sessionId, delayMs);
  }

  async evaluateSession(workspaceId: string, session: LiveSession): Promise<LiveHealthReport> {
    const sample = await this.connections.probe(workspaceId, session);
    const now = Date.now();
    const sampledAt = new Date(now).toISOString();
    const lastHeartbeat = session.lastHeartbeat ? Date.parse(session.lastHeartbeat) : null;
    const heartbeatLost = lastHeartbeat === null || now - lastHeartbeat > HEARTBEAT_TIMEOUT_MS;

    if (heartbeatLost && isActiveLiveSessionStatus(session.status)) {
      const already = this.events
        .getPublishedEvents()
        .filter((e) => e.eventType === 'HeartbeatLost' && e.sessionId === session.id);
      if (already.length === 0) {
        await this.events.publish({
          eventType: 'HeartbeatLost',
          sessionId: session.id,
          occurredAt: sampledAt,
          lastHeartbeat: session.lastHeartbeat,
        });
      }
    }

    const lastSync = this.sync.getLastCompletedAt(session.id);
    const synchronizationDelayMs = lastSync ? now - Date.parse(lastSync) : null;

    const alerts: LiveAlert[] = [];
    if (!sample.connected) {
      alerts.push({
        type: 'connection_lost',
        severity: 'critical',
        message: `Exchange ${session.exchange} connection lost`,
        sessionId: session.id,
      });
      alerts.push({
        type: 'exchange_unavailable',
        severity: 'critical',
        message: `Exchange ${session.exchange} unavailable`,
        sessionId: session.id,
      });
    }
    if (session.status === 'RECONNECTING') {
      alerts.push({
        type: 'reconnecting',
        severity: 'warning',
        message: `Session ${session.id} is reconnecting`,
        sessionId: session.id,
      });
    }
    if (session.synchronizationState === 'OUT_OF_SYNC') {
      alerts.push({
        type: 'synchronization_failed',
        severity: 'warning',
        message: `Session ${session.id} is out of sync`,
        sessionId: session.id,
      });
    }
    if (heartbeatLost && isActiveLiveSessionStatus(session.status)) {
      alerts.push({
        type: 'heartbeat_timeout',
        severity: 'critical',
        message: `Heartbeat timeout for session ${session.id}`,
        sessionId: session.id,
      });
    }
    if (session.tradingFrozen) {
      alerts.push({
        type: 'kill_switch_active',
        severity: 'critical',
        message: `Kill switch active — trading frozen for session ${session.id}`,
        sessionId: session.id,
      });
    }

    const healthy =
      sample.connected &&
      !heartbeatLost &&
      !session.tradingFrozen &&
      session.synchronizationState !== 'OUT_OF_SYNC' &&
      session.status !== 'FAILED';

    return Object.freeze({
      sessionId: session.id,
      status: session.status,
      heartbeat: session.lastHeartbeat,
      heartbeatLost,
      websocketLatencyMs: sample.websocketLatencyMs,
      restLatencyMs: sample.restLatencyMs,
      reconnectCount: session.reconnectCount,
      synchronizationState: session.synchronizationState,
      synchronizationDelayMs,
      orderAcknowledgementDelayMs: this.orderAckDelays.get(session.id) ?? null,
      healthy,
      alerts: Object.freeze(alerts),
      sampledAt,
    });
  }

  async evaluateWorkspace(workspaceId: string): Promise<LiveWorkspaceHealth> {
    const sessions = await this.sessions.list(workspaceId);
    const active = sessions.filter((s) => isActiveLiveSessionStatus(s.status));
    const reports: LiveHealthReport[] = [];
    for (const session of active) {
      reports.push(await this.evaluateSession(workspaceId, session));
    }
    const alerts = reports.flatMap((r) => r.alerts);
    const sampledAt = new Date().toISOString();
    return Object.freeze({
      sessions: Object.freeze(reports),
      alerts: Object.freeze(alerts),
      healthy: reports.every((r) => r.healthy),
      sampledAt,
    });
  }
}
