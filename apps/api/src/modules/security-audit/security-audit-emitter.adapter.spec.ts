import { describe, expect, it } from 'vitest';
import { toSecurityAuditWrite } from './security-audit-emitter.adapter';

describe('security-audit-emitter.adapter (V3-S05-a)', () => {
  it('maps structured authz events into audit writes', () => {
    const write = toSecurityAuditWrite(
      'authz.role-change',
      {
        event: 'authz.role-change',
        outcome: 'assigned',
        actorUserId: 'admin-1',
        subjectUserId: 'user-2',
        fromRole: 'RESEARCHER',
        toRole: 'TRADER',
      },
      'authorization',
    );

    expect(write).toMatchObject({
      eventType: 'authz.role-change',
      outcome: 'assigned',
      source: 'authorization',
      attribution: {
        actorId: 'admin-1',
        subjectId: 'user-2',
        resourceType: 'user-role',
      },
      payload: { fromRole: 'RESEARCHER', toRole: 'TRADER' },
    });
  });

  it('excludes routine session refresh from audit history', () => {
    expect(
      toSecurityAuditWrite(
        'auth.session',
        {
          event: 'auth.session',
          outcome: 'refresh',
          userId: 'user-1',
          sessionId: 'sess-1',
        },
        'authentication',
      ),
    ).toBeUndefined();
  });

  it('maps vault lifecycle facts without secret-shaped fields', () => {
    const write = toSecurityAuditWrite(
      'vault.lifecycle',
      {
        event: 'vault.lifecycle',
        outcome: 'revoked',
        actorUserId: 'admin-1',
        workspaceId: 'ws-1',
        type: 'binance_api',
        purpose: 'venue_trading',
      },
      'vault',
    );

    expect(write).toMatchObject({
      eventType: 'vault.lifecycle',
      outcome: 'revoked',
      attribution: {
        actorId: 'admin-1',
        workspaceId: 'ws-1',
        resourceType: 'vault-slot',
        resourceId: 'binance_api:venue_trading',
      },
      payload: { type: 'binance_api', purpose: 'venue_trading' },
    });
  });
});
