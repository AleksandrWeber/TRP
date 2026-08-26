/**
 * Workspace AI Request outcomes (W2-S05-b).
 *
 * Succeeded means only that this single request completed with a response.
 * It does not mean chat, conversation history, AI memory, or AI Platform.
 */

export const WORKSPACE_AI_REQUEST_STATUSES = ['SUCCEEDED', 'FAILED', 'UNAVAILABLE'] as const;

export type WorkspaceAiRequestStatus = (typeof WORKSPACE_AI_REQUEST_STATUSES)[number];

export type WorkspaceAiRequestFailureReason =
  | 'NOT_CONFIGURED'
  | 'CONNECTION_UNAVAILABLE'
  | 'AUTHENTICATION_FAILED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'VALIDATION_FAILED'
  | 'REQUEST_FAILED';

export type WorkspaceAiRequestView = Readonly<{
  requestId: string;
  status: WorkspaceAiRequestStatus;
  content: string | null;
  model: string | null;
  failureReason: WorkspaceAiRequestFailureReason | null;
  vendorVisibleMessage: string;
  requestedAt: string;
  connectionId: string;
  workspaceId: string;
  sessionId: string | null;
}>;

export const WORKSPACE_AI_REQUEST_SYSTEM_PROMPT =
  'You are answering a single workspace AI request. Respond only to the current request. Do not assume prior conversation, memory, or history.';

export function vendorVisibleMessageForAiRequest(
  status: WorkspaceAiRequestStatus,
  failureReason: WorkspaceAiRequestFailureReason | null,
): string {
  if (status === 'SUCCEEDED') {
    return 'OpenRouter returned a response for this request.';
  }
  switch (failureReason) {
    case 'NOT_CONFIGURED':
      return 'OpenRouter is not configured for this workspace.';
    case 'CONNECTION_UNAVAILABLE':
      return 'OpenRouter connectivity is unavailable for this workspace.';
    case 'AUTHENTICATION_FAILED':
      return 'OpenRouter rejected the workspace API key.';
    case 'PROVIDER_UNAVAILABLE':
      return 'OpenRouter was unreachable.';
    case 'TIMEOUT':
      return 'The AI request timed out.';
    case 'VALIDATION_FAILED':
      return 'The AI request could not be validated.';
    case 'REQUEST_FAILED':
    default:
      return 'The AI request failed.';
  }
}
