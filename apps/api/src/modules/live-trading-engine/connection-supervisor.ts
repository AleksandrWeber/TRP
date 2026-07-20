import { Inject, Injectable } from '@nestjs/common';
import { ExchangeAdapterService } from '../exchange-adapter';
import type { LiveSession } from './domain/live-session';
import { beginReconnecting, failLiveSession, markConnected } from './domain/live-session';
import { LiveEventPublisher } from './live-event-publisher';
import { LiveSessionManager } from './live-session-manager';
import { LiveConnectionFailedError, LiveSessionInvalidStateError } from './live-trading-errors';

export type ConnectionHealthSample = Readonly<{
  sessionId: string;
  connected: boolean;
  restLatencyMs: number | null;
  websocketLatencyMs: number | null;
  sampledAt: string;
}>;

/**
 * ConnectionSupervisor — manages exchange connection lifecycle for live sessions (US210).
 * Uses Exchange Adapter only; does not mutate Trading Core.
 */
@Injectable()
export class ConnectionSupervisor {
  private readonly samples = new Map<string, ConnectionHealthSample>();

  constructor(
    @Inject(LiveSessionManager) private readonly sessions: LiveSessionManager,
    @Inject(ExchangeAdapterService) private readonly exchanges: ExchangeAdapterService,
    @Inject(LiveEventPublisher) private readonly events: LiveEventPublisher,
  ) {}

  getSample(sessionId: string): ConnectionHealthSample | null {
    return this.samples.get(sessionId) ?? null;
  }

  async connect(workspaceId: string, session: LiveSession): Promise<LiveSession> {
    const connecting = await this.sessions.beginConnect(workspaceId, session.id);
    try {
      const started = Date.now();
      await this.exchanges.connect(workspaceId, connecting.exchange);
      const restLatencyMs = Date.now() - started;
      const connected = await this.sessions.markConnected(workspaceId, connecting.id);
      this.samples.set(connected.id, {
        sessionId: connected.id,
        connected: true,
        restLatencyMs,
        websocketLatencyMs: restLatencyMs,
        sampledAt: connected.updatedAt,
      });
      return connected;
    } catch (error) {
      const now = new Date().toISOString();
      const failed = failLiveSession(connecting, now);
      await this.sessions.save(failed);
      throw new LiveConnectionFailedError(
        error instanceof Error ? error.message : 'Exchange connection failed',
        error,
      );
    }
  }

  async disconnect(workspaceId: string, session: LiveSession): Promise<void> {
    try {
      await this.exchanges.disconnect(workspaceId, session.exchange, 'live session stop');
    } catch {
      // Best-effort disconnect on stop.
    }
    this.samples.set(session.id, {
      sessionId: session.id,
      connected: false,
      restLatencyMs: null,
      websocketLatencyMs: null,
      sampledAt: new Date().toISOString(),
    });
  }

  async reconnect(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    const now = new Date().toISOString();
    let reconnecting: LiveSession;
    try {
      reconnecting = beginReconnecting(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot reconnect session',
      );
    }
    await this.sessions.save(reconnecting);

    try {
      await this.exchanges.disconnect(workspaceId, reconnecting.exchange, 'reconnect');
    } catch {
      // Ignore disconnect failures before reconnect.
    }

    try {
      const started = Date.now();
      await this.exchanges.connect(workspaceId, reconnecting.exchange);
      const restLatencyMs = Date.now() - started;
      const connected = markConnected(reconnecting, new Date().toISOString());
      const saved = await this.sessions.save(connected);
      this.samples.set(saved.id, {
        sessionId: saved.id,
        connected: true,
        restLatencyMs,
        websocketLatencyMs: restLatencyMs,
        sampledAt: saved.updatedAt,
      });
      await this.events.publish({
        eventType: 'HeartbeatRestored',
        sessionId: saved.id,
        occurredAt: saved.updatedAt,
        lastHeartbeat: saved.lastHeartbeat ?? saved.updatedAt,
      });
      return saved;
    } catch (error) {
      const failed = failLiveSession(reconnecting, new Date().toISOString());
      await this.sessions.save(failed);
      throw new LiveConnectionFailedError(
        error instanceof Error ? error.message : 'Exchange reconnect failed',
        error,
      );
    }
  }

  async probe(workspaceId: string, session: LiveSession): Promise<ConnectionHealthSample> {
    const started = Date.now();
    try {
      const status = await this.exchanges.getExchange(workspaceId, session.exchange);
      const restLatencyMs = Date.now() - started;
      const connected = status.connection?.status === 'CONNECTED';
      const sample: ConnectionHealthSample = {
        sessionId: session.id,
        connected,
        restLatencyMs,
        websocketLatencyMs: status.connection?.latencyMs ?? restLatencyMs,
        sampledAt: new Date().toISOString(),
      };
      this.samples.set(session.id, sample);
      if (connected) {
        await this.sessions.heartbeat(session);
      }
      return sample;
    } catch {
      const sample: ConnectionHealthSample = {
        sessionId: session.id,
        connected: false,
        restLatencyMs: Date.now() - started,
        websocketLatencyMs: null,
        sampledAt: new Date().toISOString(),
      };
      this.samples.set(session.id, sample);
      return sample;
    }
  }
}
