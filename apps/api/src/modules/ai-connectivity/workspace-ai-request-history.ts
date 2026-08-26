/**
 * Workspace AI Request History (W2-S05-d).
 *
 * Read-only audit-style operational record of independently executed AI requests.
 * History ≠ Conversation. History ≠ Chat. History ≠ Memory. History ≠ Knowledge.
 * History never reconstructs context and never influences future AI requests.
 */

export type WorkspaceAiRequestHistoryView = Readonly<{
  id: string;
  workspaceId: string;
  sessionId: string;
  requestId: string;
  connectionId: string;
  executedAt: string;
  status: string;
  model: string | null;
  durationMs: number;
}>;

export type WorkspaceAiRequestHistoryFilter = Readonly<{
  sessionId?: string;
  status?: string;
  requestId?: string;
}>;
