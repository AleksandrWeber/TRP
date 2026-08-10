import type { CommandCenterProjectionErrors } from './load-projections';
import type { SessionLifecycleAction } from './session-commands';

export type NotificationTone = 'success' | 'warning' | 'error' | 'critical';

export type OperatorNotification = {
  id: string;
  tone: NotificationTone;
  title: string;
  message: string;
  createdAt: string;
  /** Critical errors stay until the operator dismisses them. */
  sticky: boolean;
};

export const AUTO_DISMISS_MS = 5_000;

export type OperatorErrorKind =
  | 'permission_denied'
  | 'operation_unavailable'
  | 'network_error'
  | 'backend_unavailable'
  | 'session_already_stopped'
  | 'session_unavailable'
  | 'generic';

let notificationSeq = 0;

export function resetNotificationSeqForTests(): void {
  notificationSeq = 0;
}

export function createNotification(input: {
  tone: NotificationTone;
  title: string;
  message: string;
  sticky?: boolean;
  createdAt?: string;
  id?: string;
}): OperatorNotification {
  notificationSeq += 1;
  return {
    id: input.id ?? `cc-note-${notificationSeq}`,
    tone: input.tone,
    title: input.title,
    message: input.message,
    createdAt: input.createdAt ?? new Date().toISOString(),
    sticky: input.sticky ?? input.tone === 'critical',
  };
}

export function dismissNotification(
  items: readonly OperatorNotification[],
  id: string,
): OperatorNotification[] {
  return items.filter((item) => item.id !== id);
}

export function prependNotification(
  items: readonly OperatorNotification[],
  next: OperatorNotification,
  limit = 12,
): OperatorNotification[] {
  return [next, ...items].slice(0, limit);
}

export function capitalizeAction(action: SessionLifecycleAction): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

export function lifecycleSuccessNotification(
  action: SessionLifecycleAction,
  sessionId: string,
): OperatorNotification {
  return createNotification({
    tone: 'success',
    title: `${capitalizeAction(action)} completed`,
    message: `${capitalizeAction(action)} confirmed for ${sessionId}.`,
  });
}

export function manualRefreshSuccessNotification(): OperatorNotification {
  return createNotification({
    tone: 'success',
    title: 'Manual Refresh completed',
    message: 'Command Center projections were reloaded.',
  });
}

export function partialRefreshWarningNotification(failed: string[]): OperatorNotification {
  return createNotification({
    tone: 'warning',
    title: 'Refresh returned partial data',
    message: `Some projections failed: ${failed.join(', ')}. Other panels remain usable.`,
  });
}

export function sessionUnavailableWarningNotification(sessionId: string): OperatorNotification {
  return createNotification({
    tone: 'warning',
    title: 'Session unavailable',
    message: `${sessionId} is no longer present in the latest projection.`,
  });
}

export function sessionAlreadyStoppedWarningNotification(sessionId: string): OperatorNotification {
  return createNotification({
    tone: 'warning',
    title: 'Session already stopped',
    message: `${sessionId} is already stopped. No further lifecycle change was applied.`,
  });
}

/** Classify a caught API/UI error into an operator-facing notification. */
export function classifyOperatorError(err: unknown): {
  kind: OperatorErrorKind;
  notification: OperatorNotification;
} {
  const message = err instanceof Error ? err.message : String(err ?? '');
  const lower = message.toLowerCase();

  if (
    lower.includes('do not have permission') ||
    lower.includes('forbidden') ||
    lower.includes('http 403') ||
    lower.includes('"statuscode":403')
  ) {
    return {
      kind: 'permission_denied',
      notification: createNotification({
        tone: 'critical',
        sticky: true,
        title: 'Permission denied',
        message: 'You do not have permission to perform this action.',
      }),
    };
  }

  if (
    lower.includes('cannot reach api') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error')
  ) {
    return {
      kind: 'network_error',
      notification: createNotification({
        tone: 'critical',
        sticky: true,
        title: 'Network error',
        message: 'Cannot reach the API. Check connectivity, then retry.',
      }),
    };
  }

  if (
    lower.includes('unexpected server error') ||
    lower.includes('backend unavailable') ||
    lower.includes('http 5') ||
    /\b5\d\d\b/.test(lower)
  ) {
    return {
      kind: 'backend_unavailable',
      notification: createNotification({
        tone: 'critical',
        sticky: true,
        title: 'Backend unavailable',
        message: 'The backend did not complete the request. Try again after Manual Refresh.',
      }),
    };
  }

  if (
    lower.includes('already stopped') ||
    (lower.includes('stopped') && lower.includes('already'))
  ) {
    return {
      kind: 'session_already_stopped',
      notification: sessionAlreadyStoppedWarningNotification('session'),
    };
  }

  if (lower.includes('not found') || lower.includes('unavailable') || lower.includes('http 404')) {
    if (lower.includes('session') || lower.includes('bot') || lower.includes('resource')) {
      return {
        kind: 'session_unavailable',
        notification: createNotification({
          tone: 'warning',
          title: 'Session unavailable',
          message: message || 'Requested session is unavailable in the current projection.',
        }),
      };
    }
    return {
      kind: 'operation_unavailable',
      notification: createNotification({
        tone: 'error',
        title: 'Operation unavailable',
        message: message || 'This operation is not available right now.',
      }),
    };
  }

  if (
    lower.includes('operation unavailable') ||
    lower.includes('not available') ||
    lower.includes('conflict') ||
    lower.includes('http 409') ||
    lower.includes('http 422')
  ) {
    return {
      kind: 'operation_unavailable',
      notification: createNotification({
        tone: 'error',
        title: 'Operation unavailable',
        message: message || 'This operation is not available right now.',
      }),
    };
  }

  return {
    kind: 'generic',
    notification: createNotification({
      tone: 'error',
      title: 'Operation failed',
      message: message || 'The operation did not complete.',
    }),
  };
}

export function lifecycleErrorNotification(
  action: SessionLifecycleAction,
  sessionId: string,
  err: unknown,
): OperatorNotification {
  const classified = classifyOperatorError(err);
  if (classified.kind === 'session_already_stopped') {
    return sessionAlreadyStoppedWarningNotification(sessionId);
  }
  if (classified.kind === 'session_unavailable') {
    return sessionUnavailableWarningNotification(sessionId);
  }
  return createNotification({
    ...classified.notification,
    message: classified.notification.message.includes(sessionId)
      ? classified.notification.message
      : `${classified.notification.message} (${capitalizeAction(action)} · ${sessionId})`,
  });
}

export function projectionFailureLabels(errors: CommandCenterProjectionErrors): string[] {
  const labels: string[] = [];
  if (errors.health) labels.push('health');
  if (errors.bots) labels.push('bots');
  if (errors.paperSessions) labels.push('paper');
  if (errors.exchangeStatus) labels.push('exchange status');
  if (errors.exchangeScope) labels.push('exchange scope');
  return labels;
}

export function isTotalProjectionFailure(errors: CommandCenterProjectionErrors): boolean {
  return Boolean(
    errors.health &&
    errors.bots &&
    errors.paperSessions &&
    errors.exchangeStatus &&
    errors.exchangeScope,
  );
}

export function isPartialProjectionFailure(errors: CommandCenterProjectionErrors): boolean {
  const failed = projectionFailureLabels(errors);
  return failed.length > 0 && !isTotalProjectionFailure(errors);
}

export function scheduleAutoDismiss(
  id: string,
  dismiss: (id: string) => void,
  ms: number = AUTO_DISMISS_MS,
  schedule: typeof setTimeout = setTimeout,
): ReturnType<typeof setTimeout> {
  return schedule(() => {
    dismiss(id);
  }, ms);
}
