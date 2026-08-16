import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  Post,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { Public } from './decorators/public.decorator';
import { RequirePermission } from './decorators/require-permission.decorator';
import { PermissionClass } from './permission-catalog';
import { RolesGuard } from './roles.guard';
import type { AuthUser } from './jwt.strategy';

@Injectable()
class ProbeAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();
    const role = request.headers['x-test-role'];
    if (role) {
      request.user = {
        userId: 'user-1',
        email: 'op@trp.local',
        displayName: 'Operator',
        role: role as Role,
      };
    }
    return true;
  }
}

@Controller({ path: 's02b-probe', version: '1' })
class SurfaceProbeController {
  @Public()
  @Get('public')
  publicRoute() {
    return { ok: true };
  }

  @RequirePermission(PermissionClass.Research)
  @Post('research')
  research() {
    return { ok: true };
  }

  @RequirePermission(PermissionClass.PaperCommand)
  @Post('paper')
  paper() {
    return { ok: true };
  }

  @RequirePermission(PermissionClass.RoleAdmin)
  @Get('admin')
  admin() {
    return { ok: true };
  }

  @RequirePermission(PermissionClass.LiveCommand)
  @Post('live')
  live() {
    return { ok: true };
  }
}

describe('Surface coverage HTTP (V3-S02-b)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SurfaceProbeController],
      providers: [Reflector, ProbeAuthGuard, RolesGuard],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.enableVersioning({ type: VersioningType.URI });
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new ProbeAuthGuard(), new RolesGuard(reflector));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 for public endpoints without a role', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/s02b-probe/public' });
    expect(response.statusCode).toBe(200);
  });

  it('returns 403 when Reader hits research or paper', async () => {
    const research = await app.inject({
      method: 'POST',
      url: '/v1/s02b-probe/research',
      headers: { 'x-test-role': Role.Reader },
    });
    const paper = await app.inject({
      method: 'POST',
      url: '/v1/s02b-probe/paper',
      headers: { 'x-test-role': Role.Reader },
    });
    expect(research.statusCode).toBe(403);
    expect(paper.statusCode).toBe(403);
  });

  it('returns 200 for Researcher research and 403 for paper', async () => {
    const research = await app.inject({
      method: 'POST',
      url: '/v1/s02b-probe/research',
      headers: { 'x-test-role': Role.Researcher },
    });
    const paper = await app.inject({
      method: 'POST',
      url: '/v1/s02b-probe/paper',
      headers: { 'x-test-role': Role.Researcher },
    });
    expect(research.statusCode).toBeGreaterThanOrEqual(200);
    expect(research.statusCode).toBeLessThan(300);
    expect(paper.statusCode).toBe(403);
  });

  it('returns 200 for Trader paper and 403 for administration', async () => {
    const paper = await app.inject({
      method: 'POST',
      url: '/v1/s02b-probe/paper',
      headers: { 'x-test-role': Role.Trader },
    });
    const admin = await app.inject({
      method: 'GET',
      url: '/v1/s02b-probe/admin',
      headers: { 'x-test-role': Role.Trader },
    });
    expect(paper.statusCode).toBeGreaterThanOrEqual(200);
    expect(paper.statusCode).toBeLessThan(300);
    expect(admin.statusCode).toBe(403);
  });

  it('returns 200 for Admin administration and 403 for live', async () => {
    const admin = await app.inject({
      method: 'GET',
      url: '/v1/s02b-probe/admin',
      headers: { 'x-test-role': Role.Admin },
    });
    const live = await app.inject({
      method: 'POST',
      url: '/v1/s02b-probe/live',
      headers: { 'x-test-role': Role.Admin },
    });
    expect(admin.statusCode).toBe(200);
    expect(live.statusCode).toBe(403);
  });

  it('returns 403 for missing and unknown roles on classified routes', async () => {
    const missing = await app.inject({ method: 'POST', url: '/v1/s02b-probe/research' });
    const unknown = await app.inject({
      method: 'POST',
      url: '/v1/s02b-probe/research',
      headers: { 'x-test-role': 'Superuser' },
    });
    expect(missing.statusCode).toBe(403);
    expect(unknown.statusCode).toBe(403);
  });
});
