import { describe, expect, it } from 'vitest';
import {
  assertRecoverableNotificationQueue,
  assertRecoverableNotificationQueueItem,
  NotificationQueueRecoveryError,
  sortQueueItemsDeterministically,
} from './notification-queue-restart-recovery';

describe('W3-O02-c notification-queue-restart-recovery domain', () => {
  it('accepts a well-formed queue item', () => {
    const item = assertRecoverableNotificationQueueItem(
      {
        queueItemId: 'nq-1',
        workspaceId: 'ws-1',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'S',
        body: 'B',
        status: 'pending',
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      },
      0,
    );
    expect(item.queueItemId).toBe('nq-1');
  });

  it('rejects duplicate ids and invalid status', () => {
    const base = {
      queueItemId: 'nq-1',
      workspaceId: 'ws-1',
      userId: 'u-1',
      type: 'daily-report',
      subject: 'S',
      body: 'B',
      status: 'pending',
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    };
    expect(() => assertRecoverableNotificationQueue({ queue: [base, base] })).toThrow(/duplicate/i);
    expect(() =>
      assertRecoverableNotificationQueueItem({ ...base, status: 'dead_letter' }, 0),
    ).toThrow(NotificationQueueRecoveryError);
  });

  it('orders deterministically', () => {
    const a = assertRecoverableNotificationQueueItem(
      {
        queueItemId: 'nq-2',
        workspaceId: 'ws-1',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'S',
        body: 'B',
        status: 'pending',
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      },
      0,
    );
    const b = assertRecoverableNotificationQueueItem(
      {
        queueItemId: 'nq-1',
        workspaceId: 'ws-1',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'S',
        body: 'B',
        status: 'pending',
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      },
      0,
    );
    expect(sortQueueItemsDeterministically([a, b]).map((i) => i.queueItemId)).toEqual([
      'nq-1',
      'nq-2',
    ]);
  });
});
