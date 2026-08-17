import { describe, expect, it } from 'vitest';
import type { LogContext, Logger } from '../../logging/logger';
import { PermissionClass } from './permission-catalog';
import {
  AUTHZ_DENY_EVENT,
  AUTHZ_ROLE_CHANGE_EVENT,
  authorizationEventLeaksSensitiveData,
  recordC6Deny,
  recordRoleChange,
} from './authorization-events';

class RecordingLogger implements Logger {
  readonly entries: Array<{ level: string; message: string; context?: LogContext }> = [];

  child(_component: string): Logger {
    return this;
  }

  debug(message: string, context?: LogContext): void {
    this.entries.push({ level: 'debug', message, context });
  }

  info(message: string, context?: LogContext): void {
    this.entries.push({ level: 'info', message, context });
  }

  warn(message: string, context?: LogContext): void {
    this.entries.push({ level: 'warn', message, context });
  }

  error(message: string, context?: LogContext): void {
    this.entries.push({ level: 'error', message, context });
  }
}

describe('Authorization events (V3-S02-e)', () => {
  it('records an assigned role change with actor, subject, from, and to', async () => {
    const logger = new RecordingLogger();

    await recordRoleChange(logger, {
      outcome: 'assigned',
      actorUserId: 'admin-1',
      subjectUserId: 'op-2',
      fromRole: 'Researcher',
      toRole: 'Trader',
    });

    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0]).toMatchObject({
      level: 'info',
      message: AUTHZ_ROLE_CHANGE_EVENT,
      context: {
        event: AUTHZ_ROLE_CHANGE_EVENT,
        outcome: 'assigned',
        actorUserId: 'admin-1',
        subjectUserId: 'op-2',
        fromRole: 'Researcher',
        toRole: 'Trader',
      },
    });
    expect(logger.entries[0].context).not.toHaveProperty('workspaceId');
    expect(authorizationEventLeaksSensitiveData(logger.entries[0].context)).toBe(false);
  });

  it('records last-Admin and self-role refusals without secrets', async () => {
    const logger = new RecordingLogger();

    await recordRoleChange(logger, {
      outcome: 'denied',
      actorUserId: 'admin-1',
      subjectUserId: 'admin-1',
      fromRole: 'Admin',
      toRole: 'Trader',
      reason: 'self_role',
    });
    await recordRoleChange(logger, {
      outcome: 'denied',
      actorUserId: 'admin-2',
      subjectUserId: 'admin-1',
      fromRole: 'Admin',
      toRole: 'Reader',
      reason: 'last_admin',
    });

    expect(logger.entries.every((entry) => entry.level === 'warn')).toBe(true);
    expect(logger.entries.map((entry) => entry.context?.reason)).toEqual([
      'self_role',
      'last_admin',
    ]);
    expect(
      logger.entries.every((entry) => !authorizationEventLeaksSensitiveData(entry.context)),
    ).toBe(true);
  });

  it('records a C6 deny with permission, actor, role, and reason', () => {
    const logger = new RecordingLogger();

    recordC6Deny(logger, {
      actorUserId: 'trader-1',
      role: 'Trader',
      reason: 'missing_permission',
    });

    expect(logger.entries[0]).toMatchObject({
      level: 'warn',
      message: AUTHZ_DENY_EVENT,
      context: {
        event: AUTHZ_DENY_EVENT,
        outcome: 'denied',
        permission: PermissionClass.RoleAdmin,
        actorUserId: 'trader-1',
        role: 'Trader',
        reason: 'missing_permission',
      },
    });
    expect(authorizationEventLeaksSensitiveData(logger.entries[0].context)).toBe(false);
  });

  it('keeps workspace attribution on a workspace-scoped authorization denial', () => {
    const logger = new RecordingLogger();

    recordC6Deny(logger, {
      actorUserId: 'admin-1',
      role: 'Administrator',
      reason: 'workspace_forbidden',
      workspaceId: 'workspace-a',
    });

    expect(logger.entries[0].context).toMatchObject({
      event: AUTHZ_DENY_EVENT,
      actorUserId: 'admin-1',
      workspaceId: 'workspace-a',
    });
  });

  it('treats password, token, hash, and email fields as sensitive leaks', () => {
    expect(
      authorizationEventLeaksSensitiveData({
        event: AUTHZ_ROLE_CHANGE_EVENT,
        password: 'secret',
      }),
    ).toBe(true);
    expect(
      authorizationEventLeaksSensitiveData({
        event: AUTHZ_DENY_EVENT,
        accessToken: 'jwt',
      }),
    ).toBe(true);
    expect(
      authorizationEventLeaksSensitiveData({
        event: AUTHZ_ROLE_CHANGE_EVENT,
        email: 'admin@example.com',
      }),
    ).toBe(true);
    expect(
      authorizationEventLeaksSensitiveData({
        event: AUTHZ_ROLE_CHANGE_EVENT,
        actorUserId: 'admin-1',
        subjectUserId: 'op-2',
      }),
    ).toBe(false);
  });
});
