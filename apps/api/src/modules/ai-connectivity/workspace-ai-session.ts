/**
 * Workspace AI Session (W2-S05-c).
 *
 * A Session is metadata-only operational grouping for independent AI requests.
 * Session ≠ Conversation. Session ≠ Memory. Session ≠ Chat. Session ≠ Context.
 * Grouping requests does not imply contextual AI. Prior requests are never
 * sent to the model automatically.
 */

export const WORKSPACE_AI_SESSION_STATUSES = ['OPEN', 'CLOSED'] as const;

export type WorkspaceAiSessionStatus = (typeof WORKSPACE_AI_SESSION_STATUSES)[number];

export function isWorkspaceAiSessionStatus(value: string): value is WorkspaceAiSessionStatus {
  return (WORKSPACE_AI_SESSION_STATUSES as readonly string[]).includes(value);
}

export type WorkspaceAiSessionRequestMembershipView = Readonly<{
  requestId: string;
  connectionId: string;
  status: string;
  requestedAt: string;
}>;

export type WorkspaceAiSessionView = Readonly<{
  id: string;
  workspaceId: string;
  displayName: string;
  status: WorkspaceAiSessionStatus;
  createdBy: string;
  createdAt: string;
  closedAt: string | null;
  updatedAt: string;
  requests: WorkspaceAiSessionRequestMembershipView[];
}>;
