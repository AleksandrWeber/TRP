/**
 * PC-15 15-a — Command Center projection of a consumed SessionHandoffIntent.
 * Not Session SoT. Not an Orchestrator mutation. createsSession remains false.
 */
export type SessionHandoffConsumeView = Readonly<{
  sessionHandoffIntentId: string;
  orchestrationRunId: string | null;
  consumed: true;
  createsSession: false;
}>;

export function toSessionHandoffConsumeView(input: {
  sessionHandoffIntentId: string;
  orchestrationRunId?: string | null;
}): SessionHandoffConsumeView {
  return Object.freeze({
    sessionHandoffIntentId: input.sessionHandoffIntentId,
    orchestrationRunId: input.orchestrationRunId ?? null,
    consumed: true as const,
    createsSession: false as const,
  });
}
