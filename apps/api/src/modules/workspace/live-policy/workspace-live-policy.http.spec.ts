import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createValidationPipe, ValidationExceptionFilter } from '../../../validation';
import type { LogContext, Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { SecurityAuditService } from '../../security-audit/security-audit.service';
import type { SecurityAuditWrite } from '../../security-audit/security-audit-record';
import {
  PrismaTransactionService,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import { Role } from '../../identity/role';
import type { AuthUser } from '../../auth/jwt.strategy';
import { RolesGuard } from '../../auth/roles.guard';
import { WorkspaceAccessService } from '../workspace-access.service';
import { WorkspaceDomainService } from '../workspace-domain.service';
import { InMemoryWorkspaceRepository } from '../repositories/in-memory-workspace.repository';
import { WorkspaceLivePolicy } from './durable-workspace-live-policy-state';
import { InMemoryWorkspaceLivePolicyStateRepository } from './persistence/in-memory-workspace-live-policy-state.repository';
import { WorkspaceLivePolicyAdminService } from './workspace-live-policy-admin.service';
import { WorkspaceLivePolicyController } from './workspace-live-policy.controller';
import { AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT } from './workspace-live-policy.audit';
import { WorkspaceLivePolicyPersistenceService } from './workspace-live-policy-persistence.service';

@Injectable()
class LivePolicyAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();
    const role = request.headers['x-test-role'];
    if (!role) {
      throw new UnauthorizedException();
    }
    request.user = {
      userId: request.headers['x-test-user-id'] ?? 'caller-1',
      email: 'caller@trp.local',
      displayName: 'Caller',
      role: role as Role,
    };
    return true;
  }
}

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

  reset(): void {
    this.entries.length = 0;
  }
}

class RecordingSecurityAuditService {
  readonly writes: SecurityAuditWrite[] = [];

  async record(
    write: SecurityAuditWrite,
    _transaction?: TransactionContext,
  ): Promise<{ id: string }> {
    this.writes.push(write);
    return { id: 'audit-test' };
  }

  reset(): void {
    this.writes.length = 0;
  }
}

class ImmediateTransactionService {
  async run<T>(work: (transaction: TransactionContext) => Promise<T>): Promise<T> {
    return work(Object.freeze({}) as TransactionContext);
  }
}

describe('Workspace live-policy Admin HTTP (PROPOSED-V3-L01-S03)', () => {
  let app: NestFastifyApplication;
  let workspaces: WorkspaceDomainService;
  let livePolicy: WorkspaceLivePolicyPersistenceService;
  let audit: RecordingSecurityAuditService;
  let events: RecordingLogger;
  let ownedWorkspaceId = '';
  let foreignWorkspaceId = '';

  beforeAll(async () => {
    const workspaceRepo = new InMemoryWorkspaceRepository();
    const livePolicyRepo = new InMemoryWorkspaceLivePolicyStateRepository();
    livePolicy = new WorkspaceLivePolicyPersistenceService(livePolicyRepo);
    workspaces = new WorkspaceDomainService(workspaceRepo, livePolicy);
    const access = new WorkspaceAccessService(workspaces);
    events = new RecordingLogger();
    audit = new RecordingSecurityAuditService();

    const moduleRef = await Test.createTestingModule({
      controllers: [WorkspaceLivePolicyController],
      providers: [
        { provide: WorkspaceLivePolicyAdminService, useClass: WorkspaceLivePolicyAdminService },
        { provide: WorkspaceLivePolicyPersistenceService, useValue: livePolicy },
        { provide: WorkspaceAccessService, useValue: access },
        { provide: PrismaTransactionService, useClass: ImmediateTransactionService },
        { provide: SecurityAuditService, useValue: audit },
        { provide: LOGGER, useValue: events },
        Reflector,
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new ValidationExceptionFilter());
    const reflector = app.get(Reflector);
    app.useGlobalGuards(
      new LivePolicyAuthGuard(),
      new RolesGuard(reflector, events, audit as never),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(async () => {
    audit.reset();
    events.reset();
    const owned = await workspaces.create({ name: 'Owned', ownerUserId: 'admin-owner' });
    const foreign = await workspaces.create({ name: 'Foreign', ownerUserId: 'other-owner' });
    ownedWorkspaceId = owned.id;
    foreignWorkspaceId = foreign.id;
  });

  afterAll(async () => {
    await app.close();
  });

  function headers(role: Role, userId: string, extra?: Record<string, string>) {
    return {
      'x-test-role': role,
      'x-test-user-id': userId,
      ...extra,
    };
  }

  it('T-01/T-02 Admin owner can enable PAPER → LIVE_POLICY_OPTED_IN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ownedWorkspaceId}/live-policy/enable`,
      headers: headers(Role.Admin, 'admin-owner', { 'x-request-id': 'req-enable-1' }),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.policy).toBe(WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN);
    expect(body.liveTradingAuthorized).toBe(false);
    expect(await livePolicy.resolveEffectivePolicy(ownedWorkspaceId)).toBe(
      WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    );
    expect(audit.writes).toHaveLength(1);
    expect(audit.writes[0].eventType).toBe(AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT);
    expect(audit.writes[0].attribution?.actorId).toBe('admin-owner');
    expect(audit.writes[0].attribution?.workspaceId).toBe(ownedWorkspaceId);
    expect(audit.writes[0].payload).toMatchObject({
      fromPolicy: WorkspaceLivePolicy.PAPER,
      toPolicy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    });
    expect(audit.writes[0].correlationId).toBe('req-enable-1');
  });

  it('T-03/T-04 Admin owner can disable LIVE_POLICY_OPTED_IN → PAPER', async () => {
    await livePolicy.persistPolicy({
      workspaceId: ownedWorkspaceId,
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    });
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ownedWorkspaceId}/live-policy/disable`,
      headers: headers(Role.Admin, 'admin-owner'),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().policy).toBe(WorkspaceLivePolicy.PAPER);
    expect(await livePolicy.resolveEffectivePolicy(ownedWorkspaceId)).toBe(
      WorkspaceLivePolicy.PAPER,
    );
    expect(audit.writes).toHaveLength(1);
    expect(audit.writes[0].payload).toMatchObject({
      fromPolicy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      toPolicy: WorkspaceLivePolicy.PAPER,
    });
  });

  it('T-05/T-07 repeated enable is idempotent without duplicate transition audit', async () => {
    await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ownedWorkspaceId}/live-policy/enable`,
      headers: headers(Role.Admin, 'admin-owner'),
    });
    audit.reset();
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ownedWorkspaceId}/live-policy/enable`,
      headers: headers(Role.Admin, 'admin-owner'),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().policy).toBe(WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN);
    expect(audit.writes).toHaveLength(0);
  });

  it('T-08/T-09 unauthorized Trader cannot enable or disable', async () => {
    const enable = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ownedWorkspaceId}/live-policy/enable`,
      headers: headers(Role.Trader, 'admin-owner'),
    });
    expect(enable.statusCode).toBe(403);
    expect(audit.writes.some((w) => w.eventType === AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT)).toBe(
      false,
    );

    const disable = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ownedWorkspaceId}/live-policy/disable`,
      headers: headers(Role.Trader, 'admin-owner'),
    });
    expect(disable.statusCode).toBe(403);
  });

  it('T-10 Admin of workspace A cannot modify workspace B', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${foreignWorkspaceId}/live-policy/enable`,
      headers: headers(Role.Admin, 'admin-owner'),
    });
    expect(res.statusCode).toBe(404);
    expect(await livePolicy.resolveEffectivePolicy(foreignWorkspaceId)).toBe(
      WorkspaceLivePolicy.PAPER,
    );
    expect(audit.writes.some((w) => w.eventType === AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT)).toBe(
      false,
    );
  });

  it('T-11 unknown workspace is 404', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/workspaces/does-not-exist/live-policy/enable',
      headers: headers(Role.Admin, 'admin-owner'),
    });
    expect(res.statusCode).toBe(404);
  });

  it('T-22 failed authorization does not create successful policy-change audit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ownedWorkspaceId}/live-policy/enable`,
      headers: headers(Role.Reader, 'admin-owner'),
    });
    expect(res.statusCode).toBe(403);
    expect(audit.writes.some((w) => w.eventType === AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT)).toBe(
      false,
    );
  });

  it('unauthenticated request is 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ownedWorkspaceId}/live-policy/enable`,
    });
    expect(res.statusCode).toBe(401);
  });
});
