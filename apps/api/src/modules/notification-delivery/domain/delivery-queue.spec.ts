import { describe, expect, it } from 'vitest';
import {
  createPendingNotificationQueueItem,
  isNotificationQueueStatus,
  isOpenNotificationQueueStatus,
  queueItemToDeliverCommand,
  withNotificationQueueStatus,
} from './delivery-queue';

describe('W3-O02-b delivery-queue domain', () => {
  it('creates pending workspace-bound queue items', () => {
    const item = createPendingNotificationQueueItem({
      queueItemId: 'nq-1',
      command: {
        workspaceId: 'ws-1',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'Sub',
        body: 'Body',
        reportRunId: 'rr-1',
        requestedAt: '2026-08-27T10:00:00.000Z',
      },
    });
    expect(item.status).toBe('pending');
    expect(item.workspaceId).toBe('ws-1');
    expect(item.reportRunId).toBe('rr-1');
    expect(isOpenNotificationQueueStatus(item.status)).toBe(true);
  });

  it('transitions statuses without inventing Outbox vocabulary', () => {
    const pending = createPendingNotificationQueueItem({
      queueItemId: 'nq-2',
      command: {
        workspaceId: 'ws-1',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'Sub',
        body: 'Body',
        requestedAt: '2026-08-27T10:00:00.000Z',
      },
    });
    const inFlight = withNotificationQueueStatus(pending, 'in-flight', {
      updatedAt: '2026-08-27T10:00:01.000Z',
    });
    const retryable = withNotificationQueueStatus(inFlight, 'retryable', {
      updatedAt: '2026-08-27T10:00:02.000Z',
      detail: 'send-failed',
    });
    expect(retryable.status).toBe('retryable');
    expect(isNotificationQueueStatus('dead_letter')).toBe(false);
    expect(isNotificationQueueStatus('publishing')).toBe(false);
    expect(queueItemToDeliverCommand(retryable).workspaceId).toBe('ws-1');
  });
});
