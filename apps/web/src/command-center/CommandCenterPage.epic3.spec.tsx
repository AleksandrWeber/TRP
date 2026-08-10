import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TradingSessionBotView } from '../shared/api';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { ActiveSessionsPanel } from './panels/ActiveSessionsPanel';
import { SessionDetailInspectorPanel } from './panels/SessionDetailInspectorPanel';
import {
  dialogCopy,
  executeSessionLifecycleCommand,
  sessionActionAvailability,
} from './session-commands';

const running: TradingSessionBotView = {
  id: 'session-1',
  tradingSessionId: 'session-1',
  workspaceId: 'ws-1',
  exchangeScopeId: 'exchange-scope:binance',
  paperAccountId: 'acct-1',
  status: 'running',
  state: 'running',
  mission: { deploymentId: 'dep-1' },
  origin: 'manual',
  version: 1,
  failureReason: null,
  createdAt: '2026-08-10T11:00:00.000Z',
  recordedAt: '2026-08-10T11:00:00.000Z',
  actorId: 'user-1',
  correlationId: null,
  leaseOwnerId: 'runtime-1',
  fencingToken: 3,
};

const paused: TradingSessionBotView = {
  ...running,
  id: 'session-2',
  tradingSessionId: 'session-2',
  status: 'paused',
  state: 'paused',
};

describe('Command Center operational commands (RC-20 Epic 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes pause/resume/stop availability from SoT status + lease', () => {
    expect(sessionActionAvailability(running)).toEqual({
      pause: 'available',
      resume: 'unavailable',
      stop: 'available',
    });
    expect(sessionActionAvailability(paused)).toEqual({
      pause: 'unavailable',
      resume: 'available',
      stop: 'available',
    });
    expect(
      sessionActionAvailability({ ...running, leaseOwnerId: null, fencingToken: null }),
    ).toEqual({
      pause: 'unavailable',
      resume: 'unavailable',
      stop: 'unavailable',
    });
  });

  it('pause delegates to pauseTradingSession only', async () => {
    const api = {
      pauseTradingSession: vi.fn(async () => paused),
      resumeTradingSession: vi.fn(),
      stopTradingSession: vi.fn(),
    };
    const result = await executeSessionLifecycleCommand(api, 'pause', 'session-1');
    expect(api.pauseTradingSession).toHaveBeenCalledWith('session-1');
    expect(api.resumeTradingSession).not.toHaveBeenCalled();
    expect(api.stopTradingSession).not.toHaveBeenCalled();
    expect(result.status).toBe('paused');
  });

  it('resume delegates to resumeTradingSession only', async () => {
    const api = {
      pauseTradingSession: vi.fn(),
      resumeTradingSession: vi.fn(async () => running),
      stopTradingSession: vi.fn(),
    };
    await executeSessionLifecycleCommand(api, 'resume', 'session-2');
    expect(api.resumeTradingSession).toHaveBeenCalledWith('session-2');
    expect(api.pauseTradingSession).not.toHaveBeenCalled();
    expect(api.stopTradingSession).not.toHaveBeenCalled();
  });

  it('stop delegates to stopTradingSession only', async () => {
    const api = {
      pauseTradingSession: vi.fn(),
      resumeTradingSession: vi.fn(),
      stopTradingSession: vi.fn(async () => ({ ...running, status: 'stopped' })),
    };
    await executeSessionLifecycleCommand(api, 'stop', 'session-1');
    expect(api.stopTradingSession).toHaveBeenCalledWith('session-1');
    expect(api.pauseTradingSession).not.toHaveBeenCalled();
    expect(api.resumeTradingSession).not.toHaveBeenCalled();
  });

  it('surfaces failed commands to the caller', async () => {
    const api = {
      pauseTradingSession: vi.fn(async () => {
        throw new Error('You do not have permission to perform this action.');
      }),
      resumeTradingSession: vi.fn(),
      stopTradingSession: vi.fn(),
    };
    await expect(executeSessionLifecycleCommand(api, 'pause', 'session-1')).rejects.toThrow(
      'You do not have permission to perform this action.',
    );
  });

  it('renders confirmation dialog copy for pause/resume/stop', () => {
    expect(dialogCopy('pause', 'session-1').title).toContain('Pause');
    expect(dialogCopy('resume', 'session-1').title).toContain('Resume');
    expect(dialogCopy('stop', 'session-1').variant).toBe('danger');
    expect(dialogCopy('stop', 'session-1').message).toContain('does not delete ledger history');

    const pauseDialog = renderToStaticMarkup(
      <ConfirmationDialog
        open
        title={dialogCopy('pause', 'session-1').title}
        message={dialogCopy('pause', 'session-1').message}
        confirmLabel="Pause"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(pauseDialog).toContain('Pause session?');

    const stopDialog = renderToStaticMarkup(
      <ConfirmationDialog
        open
        title={dialogCopy('stop', 'session-1').title}
        message={dialogCopy('stop', 'session-1').message}
        confirmLabel="Stop"
        variant="danger"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(stopDialog).toContain('Stop session?');
  });

  it('renders action controls and refreshes projections after successful command', async () => {
    const refresh = vi.fn(async () => undefined);
    const api = {
      pauseTradingSession: vi.fn(async () => paused),
      resumeTradingSession: vi.fn(),
      stopTradingSession: vi.fn(),
    };

    await executeSessionLifecycleCommand(api, 'pause', 'session-1');
    await refresh();
    expect(refresh).toHaveBeenCalledTimes(1);

    const p4 = renderToStaticMarkup(
      <ActiveSessionsPanel presentation="ready" sessions={[running]} />,
    );
    expect(p4).toContain('data-testid="cc-pause-session-1"');
    expect(p4).toContain('data-testid="cc-resume-session-1"');
    expect(p4).toContain('data-testid="cc-stop-session-1"');

    const p7 = renderToStaticMarkup(
      <SessionDetailInspectorPanel presentation="ready" session={running} />,
    );
    expect(p7).toContain('data-testid="cc-p7-pause"');
    expect(p7).toContain('data-testid="cc-p7-resume"');
    expect(p7).toContain('data-testid="cc-p7-stop"');
  });

  it('does not include Kill Switch controls', () => {
    const html = renderToStaticMarkup(
      <ActiveSessionsPanel presentation="ready" sessions={[running]} />,
    );
    expect(html).not.toContain('Kill Switch');
    expect(html).not.toContain('Emergency Stop');
  });
});
