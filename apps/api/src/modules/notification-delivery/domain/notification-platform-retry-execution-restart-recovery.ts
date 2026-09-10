/**
 * W5-N18-b prep — deterministic sort only.
 * Full restart recovery hydrate is W5-N18-c.
 */

import type { DurableNotificationPlatformRetryExecutionAnchor } from './durable-notification-platform-retry-execution-anchor';

/** Deterministic recovery order: workspaceId ascending, then retryExecutionAnchorId. */
export function sortNotificationPlatformRetryExecutionAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformRetryExecutionAnchor[],
): readonly DurableNotificationPlatformRetryExecutionAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.retryExecutionAnchorId.localeCompare(b.retryExecutionAnchorId);
    }),
  );
}
