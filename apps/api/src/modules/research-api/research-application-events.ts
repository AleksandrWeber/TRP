/**
 * Application events for the US190 Research API.
 *
 * Collected in-memory by ResearchApplicationService. No transport layer
 * and no message bus.
 */

type ResearchApplicationEventBase<Type extends string> = Readonly<{
  eventType: Type;
  sessionId: string;
  occurredAt: string;
}>;

export type ResearchSessionCreated = ResearchApplicationEventBase<'ResearchSessionCreated'> &
  Readonly<{
    workspaceId: string;
    strategyId: string;
    executionMode: string;
  }>;

export type ResearchSessionStarted = ResearchApplicationEventBase<'ResearchSessionStarted'> &
  Readonly<{
    startedAt: string;
  }>;

export type ResearchSessionStopped = ResearchApplicationEventBase<'ResearchSessionStopped'> &
  Readonly<{
    stoppedAt: string;
  }>;

export type ResearchSessionRecovered = ResearchApplicationEventBase<'ResearchSessionRecovered'> &
  Readonly<{
    recoveredAt: string;
  }>;

export type ResearchApplicationEvent =
  | ResearchSessionCreated
  | ResearchSessionStarted
  | ResearchSessionStopped
  | ResearchSessionRecovered;
