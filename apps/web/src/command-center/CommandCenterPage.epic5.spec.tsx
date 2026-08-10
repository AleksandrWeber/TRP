import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationCenter } from './components/NotificationCenter';
import {
  AUTO_DISMISS_MS,
  classifyOperatorError,
  createNotification,
  dismissNotification,
  isPartialProjectionFailure,
  isTotalProjectionFailure,
  lifecycleErrorNotification,
  lifecycleSuccessNotification,
  manualRefreshSuccessNotification,
  partialRefreshWarningNotification,
  prependNotification,
  resetNotificationSeqForTests,
  scheduleAutoDismiss,
  sessionAlreadyStoppedWarningNotification,
  sessionUnavailableWarningNotification,
} from './notifications';

describe('Command Center operational notifications (RC-20 Epic 5)', () => {
  beforeEach(() => {
    resetNotificationSeqForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds success notifications for lifecycle and manual refresh', () => {
    expect(lifecycleSuccessNotification('pause', 'session-1')).toMatchObject({
      tone: 'success',
      sticky: false,
      title: 'Pause completed',
    });
    expect(lifecycleSuccessNotification('resume', 'session-1').title).toBe('Resume completed');
    expect(lifecycleSuccessNotification('stop', 'session-1').title).toBe('Stop completed');
    expect(manualRefreshSuccessNotification()).toMatchObject({
      tone: 'success',
      title: 'Manual Refresh completed',
      sticky: false,
    });
  });

  it('classifies error notifications for permission, network, backend, and unavailable', () => {
    expect(
      classifyOperatorError(new Error('You do not have permission')).notification,
    ).toMatchObject({
      tone: 'critical',
      sticky: true,
      title: 'Permission denied',
    });
    expect(
      classifyOperatorError(new Error('Cannot reach API at http://localhost:3000')).notification,
    ).toMatchObject({
      tone: 'critical',
      sticky: true,
      title: 'Network error',
    });
    expect(
      classifyOperatorError(new Error('Unexpected server error. Please try again later.'))
        .notification,
    ).toMatchObject({
      tone: 'critical',
      sticky: true,
      title: 'Backend unavailable',
    });
    expect(
      classifyOperatorError(new Error('Operation unavailable for this lease')).notification,
    ).toMatchObject({
      tone: 'error',
      title: 'Operation unavailable',
      sticky: false,
    });
  });

  it('builds warning notifications only from available signals', () => {
    expect(sessionAlreadyStoppedWarningNotification('session-9')).toMatchObject({
      tone: 'warning',
      title: 'Session already stopped',
    });
    expect(sessionUnavailableWarningNotification('session-9')).toMatchObject({
      tone: 'warning',
      title: 'Session unavailable',
    });
    expect(partialRefreshWarningNotification(['bots', 'paper'])).toMatchObject({
      tone: 'warning',
      title: 'Refresh returned partial data',
      message: expect.stringContaining('bots, paper'),
    });
    expect(
      lifecycleErrorNotification('stop', 'session-9', new Error('Session already stopped')),
    ).toMatchObject({
      tone: 'warning',
      title: 'Session already stopped',
      message: expect.stringContaining('session-9'),
    });
  });

  it('detects partial vs total projection failures for refresh warnings', () => {
    expect(
      isPartialProjectionFailure({
        health: null,
        bots: 'fail',
        paperSessions: null,
        exchangeStatus: null,
        exchangeScope: null,
      }),
    ).toBe(true);
    expect(
      isTotalProjectionFailure({
        health: 'fail',
        bots: 'fail',
        paperSessions: 'fail',
        exchangeStatus: 'fail',
        exchangeScope: 'fail',
      }),
    ).toBe(true);
  });

  it('supports manual dismissal from the in-memory list', () => {
    const a = createNotification({ tone: 'success', title: 'A', message: 'a' });
    const b = createNotification({ tone: 'error', title: 'B', message: 'b' });
    const list = prependNotification(prependNotification([], a), b);
    expect(list.map((item) => item.id)).toEqual([b.id, a.id]);
    expect(dismissNotification(list, b.id).map((item) => item.id)).toEqual([a.id]);
  });

  it('auto-dismisses non-sticky notifications after the timeout', () => {
    const dismiss = vi.fn();
    scheduleAutoDismiss('note-1', dismiss, AUTO_DISMISS_MS);
    expect(dismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(AUTO_DISMISS_MS - 1);
    expect(dismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(dismiss).toHaveBeenCalledWith('note-1');
  });

  it('renders notification center with dismiss controls and sticky critical items', () => {
    const items = [
      createNotification({
        tone: 'success',
        title: 'Pause completed',
        message: 'Pause confirmed for session-1.',
      }),
      createNotification({
        tone: 'warning',
        title: 'Refresh returned partial data',
        message: 'Some projections failed: bots.',
      }),
      createNotification({
        tone: 'critical',
        sticky: true,
        title: 'Permission denied',
        message: 'You do not have permission to perform this action.',
      }),
    ];
    const html = renderToStaticMarkup(
      <NotificationCenter notifications={items} onDismiss={() => undefined} />,
    );
    expect(html).toContain('data-testid="cc-notification-center"');
    expect(html).toContain('Pause completed');
    expect(html).toContain('Refresh returned partial data');
    expect(html).toContain('Permission denied');
    expect(html).toContain('data-sticky="true"');
    expect(html).toContain('data-testid="cc-notification-dismiss"');
  });
});
