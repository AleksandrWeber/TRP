import { Module, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LoggingModule } from '../../logging/logging.module';
import { MetricsModule } from '../../metrics/metrics.module';
import { AuthenticationService } from '../auth/authentication.service';
import { AuthCsrfGuard } from '../auth/auth-csrf.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { Role } from '../identity/role';
import { UserDomainService } from '../identity/user-domain.service';
import { SecurityAuditModule } from '../security-audit/security-audit.module';
import { SecurityAuditTimelineApiModule } from '../security-audit/security-audit-timeline-api.module';
import { SecurityAuditTimelineService } from '../security-audit/security-audit-timeline.service';
import { HoldableSecretType } from '../secret-vault/holdable-secret-type';
import { SecretVaultModule } from '../secret-vault/secret-vault.module';
import { SecretVaultService } from '../secret-vault/secret-vault.service';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { PrismaModule } from '../../storage/prisma/prisma.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';

const proofId = `f14-${Date.now()}`;
const emailA = `${proofId}-a@example.test`;
const emailB = `${proofId}-b@example.test`;
const wrappingKey = 'f14-production-composition-wrapping-key';

/**
 * The production module graph for the F-14 scope only. No provider is
 * overridden: all modules, repositories, guards, authorization, and Prisma
 * services are the same production classes used by AppModule.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    LoggingModule,
    MetricsModule,
    PrismaModule,
    SecurityAuditModule,
    WorkspaceModule,
    IdentityModule,
    AuthModule,
    SecretVaultModule,
    SecurityAuditTimelineApiModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AuthCsrfGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
class F14ProductionCompositionModule {}

describe('F-14 — production composition proof', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let authentication: AuthenticationService;
  let users: UserDomainService;
  let workspaces: WorkspaceDomainService;
  let workspaceAccess: WorkspaceAccessService;
  let vault: SecretVaultService;
  let timeline: SecurityAuditTimelineService;
  let userAId: string;
  let userBId: string;
  let workspaceAId: string;
  let workspaceBId: string;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    process.env.VAULT_WRAPPING_KEY = wrappingKey;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'f14-production-composition-jwt-secret';

    app = await NestFactory.create<NestFastifyApplication>(
      F14ProductionCompositionModule,
      new FastifyAdapter(),
      { logger: ['error'], abortOnError: false },
    );
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    authentication = app.get(AuthenticationService);
    users = app.get(UserDomainService);
    workspaces = app.get(WorkspaceDomainService);
    workspaceAccess = app.get(WorkspaceAccessService);
    vault = app.get(SecretVaultService);
    timeline = app.get(SecurityAuditTimelineService);
    prisma = app.get(PrismaService);

    const issuedA = await authentication.register(emailA, 'F-14 Workspace A', 'f14-password-123');
    const issuedB = await authentication.register(emailB, 'F-14 Workspace B', 'f14-password-123');
    userAId = issuedA.user.id;
    userBId = issuedB.user.id;

    await users.assignRole(userAId, Role.Admin);
    await users.assignRole(userBId, Role.Admin);
    tokenA = (await authentication.login(emailA, 'f14-password-123')).accessToken;
    tokenB = (await authentication.login(emailB, 'f14-password-123')).accessToken;

    const workspaceA = await workspaces.create({
      name: 'F-14 Workspace A',
      ownerUserId: userAId,
    });
    const workspaceB = await workspaces.create({
      name: 'F-14 Workspace B',
      ownerUserId: userBId,
    });
    workspaceAId = workspaceA.id;
    workspaceBId = workspaceB.id;

    await vault.store({
      actorWorkspaceId: userAId,
      actorRole: Role.Admin,
      workspaceId: workspaceAId,
      type: HoldableSecretType.Binance,
      fields: { apiKey: 'f14-a-key', apiSecret: 'f14-a-secret' },
    });
    await vault.store({
      actorWorkspaceId: userBId,
      actorRole: Role.Admin,
      workspaceId: workspaceBId,
      type: HoldableSecretType.Binance,
      fields: { apiKey: 'f14-b-key', apiSecret: 'f14-b-secret' },
    });
  });

  afterAll(async () => {
    if (app) {
      // Security Audit records are intentionally append-only and are not
      // removed by this proof. The generated workspace ids keep evidence
      // isolated from other test data.
      await prisma.vaultSecret.deleteMany({
        where: { workspaceId: { in: [workspaceAId, workspaceBId].filter(Boolean) } },
      });
      await prisma.workspaceRecord.deleteMany({
        where: { id: { in: [workspaceAId, workspaceBId].filter(Boolean) } },
      });
      await prisma.authSession.deleteMany({
        where: { userId: { in: [userAId, userBId].filter(Boolean) } },
      });
      await prisma.authLoginLockout.deleteMany({
        where: { userId: { in: [userAId, userBId].filter(Boolean) } },
      });
      await prisma.authPasswordReset.deleteMany({
        where: { userId: { in: [userAId, userBId].filter(Boolean) } },
      });
      await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
      await app.close();
    }
  });

  it('uses real Prisma persistence and the production ownership boundary', async () => {
    expect(workspaceAccess.isMember(workspaceAId, userAId)).toBe(true);
    expect(workspaceAccess.isMember(workspaceBId, userAId)).toBe(false);

    await expect(vault.list(userAId, workspaceBId, Role.Admin)).rejects.toMatchObject({
      name: 'VaultIsolationError',
    });
    await expect(
      vault.get({
        actorWorkspaceId: userAId,
        actorRole: Role.Admin,
        workspaceId: workspaceBId,
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toMatchObject({ name: 'VaultIsolationError' });
    await expect(
      vault.retrieve({
        actorWorkspaceId: userAId,
        actorRole: Role.Admin,
        workspaceId: workspaceBId,
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toMatchObject({ name: 'VaultIsolationError' });
    await expect(
      vault.store({
        actorWorkspaceId: userAId,
        actorRole: Role.Admin,
        workspaceId: workspaceBId,
        type: HoldableSecretType.Binance,
        fields: { apiKey: 'f14-forged-key', apiSecret: 'f14-forged-secret' },
      }),
    ).rejects.toMatchObject({ name: 'VaultIsolationError' });
    await expect(
      vault.replace({
        actorWorkspaceId: userAId,
        actorRole: Role.Admin,
        workspaceId: workspaceBId,
        type: HoldableSecretType.Binance,
        fields: { apiKey: 'f14-forged-replace-key', apiSecret: 'f14-forged-replace-secret' },
      }),
    ).rejects.toMatchObject({ name: 'VaultIsolationError' });
    await expect(
      vault.revoke({
        actorWorkspaceId: userAId,
        actorRole: Role.Admin,
        workspaceId: workspaceBId,
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toMatchObject({ name: 'VaultIsolationError' });
    await expect(
      vault.delete({
        actorWorkspaceId: userAId,
        actorRole: Role.Admin,
        workspaceId: workspaceBId,
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toMatchObject({ name: 'VaultIsolationError' });

    expect(await vault.list(userBId, workspaceBId, Role.Admin)).toHaveLength(1);
    expect(await prisma.vaultSecret.count({ where: { workspaceId: workspaceBId } })).toBe(1);
    expect(
      await prisma.securityAuditRecord.count({ where: { workspaceId: workspaceBId } }),
    ).toBeGreaterThan(0);
  });

  it('uses real JWT, guards, authorization, Timeline, and Audit persistence', async () => {
    const unauthenticated = await app.inject({
      method: 'GET',
      url: `/v1/security-audit/workspaces/${workspaceBId}/timeline`,
    });
    expect(unauthenticated.statusCode, unauthenticated.body).toBe(401);

    const foreign = await app.inject({
      method: 'GET',
      url: `/v1/security-audit/workspaces/${workspaceBId}/timeline`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(foreign.statusCode).toBe(403);
    expect(foreign.body).not.toContain('f14-b-key');
    expect(foreign.body).not.toContain('f14-b-secret');

    const own = await app.inject({
      method: 'GET',
      url: `/v1/security-audit/workspaces/${workspaceAId}/timeline`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(own.statusCode).toBe(200);
    expect(own.body).not.toContain('f14-b-key');
    expect(own.body).not.toContain('f14-b-secret');

    const bOwn = await app.inject({
      method: 'GET',
      url: `/v1/security-audit/workspaces/${workspaceBId}/timeline`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(bOwn.statusCode).toBe(200);
    expect(bOwn.body).not.toContain('f14-a-key');
    expect(bOwn.body).not.toContain('f14-a-secret');

    const directA = await timeline.readWorkspaceTimeline({ workspaceId: workspaceAId });
    expect(directA.entries).not.toHaveLength(0);
    expect(JSON.stringify(directA)).not.toContain('f14-b-key');
    expect(JSON.stringify(directA)).not.toContain('f14-b-secret');
  });
});
