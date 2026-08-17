import { Injectable } from '@nestjs/common';
import { ExchangeSessionAudit } from './exchange-session.audit';
import { canAutomaticallyReconnect } from './exchange-session.health';
import { projectExchangeSession, type ExchangeSessionView } from './exchange-session.projection';
import {
  applyExchangeSessionEvent,
  type ExchangeSessionEvent,
  type ExchangeSessionState,
} from './exchange-session.state';

export type ExchangeSessionObservation =
  'SESSION_EXPIRED' | 'CONNECTION_LOST' | 'PROVIDER_UNAVAILABLE';

export type ExchangeSessionActor = Readonly<{
  workspaceId: string;
  actorUserId: string;
  connectionId: string;
  provider: string;
}>;

/**
 * Exchange Connectivity session service (W2-S02-c).
 *
 * Maintains authenticated session lifecycle, health projection, and reconnect
 * eligibility. It does not poll, schedule retries, or reconnect automatically.
 */
@Injectable()
export class ExchangeSessionService {
  constructor(private readonly sessionAudit: ExchangeSessionAudit) {}

  projection(connectionType: string, status: string): ExchangeSessionView | null {
    return projectExchangeSession(connectionType, status);
  }

  observe(
    from: ExchangeSessionState,
    observation: ExchangeSessionObservation,
  ): ExchangeSessionState {
    return applyExchangeSessionEvent(from, observationEvent(observation));
  }

  apply(from: ExchangeSessionState, event: ExchangeSessionEvent): ExchangeSessionState {
    return applyExchangeSessionEvent(from, event);
  }

  async established(actor: ExchangeSessionActor): Promise<void> {
    await this.sessionAudit.record({ outcome: 'session_established', ...actor });
  }

  async expired(actor: ExchangeSessionActor): Promise<void> {
    await this.sessionAudit.record({ outcome: 'session_expired', ...actor });
    await this.sessionAudit.record({ outcome: 'reconnect_required', ...actor });
  }

  async connectionLost(actor: ExchangeSessionActor): Promise<void> {
    await this.sessionAudit.record({ outcome: 'connection_lost', ...actor });
    await this.sessionAudit.record({ outcome: 'reconnect_required', ...actor });
  }

  async reconnectRequired(actor: ExchangeSessionActor): Promise<void> {
    await this.sessionAudit.record({ outcome: 'reconnect_required', ...actor });
  }

  automaticReconnectEnabled(): false {
    return canAutomaticallyReconnect();
  }
}

function observationEvent(observation: ExchangeSessionObservation): ExchangeSessionEvent {
  switch (observation) {
    case 'SESSION_EXPIRED':
      return 'session_expired';
    case 'CONNECTION_LOST':
      return 'connection_lost';
    case 'PROVIDER_UNAVAILABLE':
      return 'provider_unavailable';
  }
}
