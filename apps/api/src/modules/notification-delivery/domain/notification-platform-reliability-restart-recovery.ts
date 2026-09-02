/**
 * W5-N17-c — Notification Platform Delivery Reliability restart recovery foundation.
 *
 * W5-N17-b uses `buildNotificationPlatformReliabilityAnchorState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W5-N17-c.
 */

import type { DurableNotificationPlatformReliabilityAnchor } from './durable-notification-platform-reliability-anchor';

/** Deterministic recovery order: workspaceId ascending, then reliabilityAnchorId. */
export function sortNotificationPlatformReliabilityAnchorsDeterministically(
  anchors: readonly DurableNotificationPlatformReliabilityAnchor[],
): readonly DurableNotificationPlatformReliabilityAnchor[] {
  return Object.freeze(
    [...anchors].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.reliabilityAnchorId.localeCompare(b.reliabilityAnchorId);
    }),
  );
}
