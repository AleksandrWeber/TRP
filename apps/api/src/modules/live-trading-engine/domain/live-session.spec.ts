import { describe, expect, it } from 'vitest';
import {
  archiveLiveSession,
  beginConnecting,
  beginReconnecting,
  createLiveSession,
  markConnected,
  pauseLiveSession,
  resumeLiveSession,
  startLiveSession,
  stopLiveSession,
  withSynchronizationState,
} from './live-session';

const T0 = '2026-07-20T18:00:00.000Z';
const T1 = '2026-07-20T18:01:00.000Z';

function base() {
  return createLiveSession({
    id: 'sess-1',
    workspaceId: 'ws-1',
    ownerId: 'owner-1',
    portfolioId: 'pf-1',
    portfolioWorkspaceKey: 'live-session:sess-1',
    exchange: 'MOCK',
    accountId: 'acct-1',
    createdAt: T0,
    updatedAt: T0,
  });
}

describe('LiveSession domain (US210)', () => {
  it('creates session in CREATED / SYNCED', () => {
    const session = base();
    expect(session.status).toBe('CREATED');
    expect(session.synchronizationState).toBe('SYNCED');
    expect(session.reconnectCount).toBe(0);
    expect(session.exchange).toBe('MOCK');
  });

  it('transitions CREATED → CONNECTING → CONNECTED → RUNNING → PAUSED → RUNNING → STOPPED', () => {
    let s = base();
    s = beginConnecting(s, T0);
    expect(s.status).toBe('CONNECTING');
    s = markConnected(s, T0);
    expect(s.status).toBe('CONNECTED');
    s = startLiveSession(s, T0);
    expect(s.status).toBe('RUNNING');
    s = pauseLiveSession(s, T1);
    expect(s.status).toBe('PAUSED');
    s = resumeLiveSession(s, T1);
    expect(s.status).toBe('RUNNING');
    s = stopLiveSession(s, T1);
    expect(s.status).toBe('STOPPED');
    expect(s.stoppedAt).toBe(T1);
  });

  it('increments reconnectCount on reconnect', () => {
    let s = startLiveSession(markConnected(beginConnecting(base(), T0), T0), T0);
    s = beginReconnecting(s, T1);
    expect(s.status).toBe('RECONNECTING');
    expect(s.reconnectCount).toBe(1);
    s = markConnected(s, T1);
    expect(s.status).toBe('CONNECTED');
  });

  it('updates synchronization state', () => {
    const s = withSynchronizationState(base(), 'SYNCING', T1);
    expect(s.synchronizationState).toBe('SYNCING');
  });

  it('archives only non-active sessions', () => {
    const running = startLiveSession(markConnected(beginConnecting(base(), T0), T0), T0);
    expect(() => archiveLiveSession(running, T1)).toThrow(/active/);
    const stopped = stopLiveSession(running, T1);
    expect(archiveLiveSession(stopped, T1).status).toBe('ARCHIVED');
  });
});
