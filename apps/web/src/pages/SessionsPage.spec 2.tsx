import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { SignInSessionView } from '../shared/api';
import { SessionsPanel } from './SessionsPage';
import {
  CURRENT_SESSION_LABEL,
  REVOKE_ONE_PROMPT,
  SESSIONS_PAGE_DESCRIPTION,
  SESSIONS_PAGE_TITLE,
} from './sessionManagement';

const sessions: SignInSessionView[] = [
  {
    id: 'here',
    current: true,
    device: 'Computer',
    browser: 'Chrome',
    network: '203.0.113.8',
    lastActiveAt: '2026-08-16T18:15:00.000Z',
    signedInAt: '2026-08-16T18:00:00.000Z',
  },
  {
    id: 'phone',
    current: false,
    device: 'Phone or tablet',
    browser: 'Safari',
    network: '198.51.100.10',
    lastActiveAt: '2026-08-16T17:00:00.000Z',
    signedInAt: '2026-08-16T17:00:00.000Z',
  },
];

function renderPanel(extra?: Partial<Parameters<typeof SessionsPanel>[0]>) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <SessionsPanel
        sessions={sessions}
        loading={false}
        busy={false}
        error={null}
        success={null}
        pending={null}
        onAsk={() => undefined}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        {...extra}
      />
    </MemoryRouter>,
  );
}

describe('SessionsPage (V3-S01-d)', () => {
  it('lists sessions, marks this device, and offers revoke controls', () => {
    const html = renderPanel();

    expect(html).toContain(SESSIONS_PAGE_TITLE);
    expect(html).toContain(SESSIONS_PAGE_DESCRIPTION);
    expect(html).toContain(CURRENT_SESSION_LABEL);
    expect(html).toContain('Computer · Chrome');
    expect(html).toContain('Phone or tablet · Safari');
    expect(html).toContain('Network 203.0.113.8');
    expect(html).toContain('End this sign-in');
    expect(html).toContain('End all other sign-ins');
    expect(html).toContain('Sign out everywhere');
    expect(html).toContain('data-testid="current-session"');
    expect(html).not.toContain('MFA');
    expect(html).not.toContain('OAuth');
    expect(html).not.toContain('passkey');
    expect(html).not.toContain('Forgot password');
    expect(html).not.toContain('Remember me');
    expect(html).not.toContain('Trust this device');
    expect(html).toContain('not a trusted-device list');
    expect(html).not.toContain('JWT');
  });

  it('asks for confirmation before ending another sign-in', () => {
    const html = renderPanel({ pending: { kind: 'revoke-one', sessionId: 'phone' } });
    expect(html).toContain(REVOKE_ONE_PROMPT);
    expect(html).toContain('Cancel');
  });

  it('disables end-others when this is the only sign-in', () => {
    const html = renderPanel({ sessions: [sessions[0]] });
    expect(html).toContain('disabled');
    expect(html).toContain('End all other sign-ins');
  });
});
