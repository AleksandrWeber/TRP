import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { resolveApplicationVersion } from './application-version';
import { verifyConfigurationValidity } from './configuration-validity';
import { deriveOverallHealthStatus } from './health-status';
import {
  compareMigrations,
  listLocalMigrations,
  resolveMigrationsDirectory,
} from './prisma-migration-check';
import {
  resolveRuntimeEnvironment,
  shouldFailStartupOnVerificationError,
} from './runtime-environment';
import { createRuntimeHealthReport } from './runtime-health-report';
import { RuntimeHealthService } from './runtime-health.service';
import { StartupVerification, StartupVerificationError } from './startup-verification';
import { VersionCheck } from './version-check';
import type { Logger } from '../../logging/logger';

function createLogger(): Logger {
  const logger: Logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => logger),
  };
  return logger;
}

describe('RC-01 Runtime Health', () => {
  describe('deriveOverallHealthStatus', () => {
    it('returns ok when api, database, and migrations are healthy', () => {
      expect(
        deriveOverallHealthStatus({
          api: 'up',
          database: 'up',
          migrations: 'up_to_date',
        }),
      ).toBe('ok');
    });

    it('returns unhealthy when database is down', () => {
      expect(
        deriveOverallHealthStatus({
          api: 'up',
          database: 'down',
          migrations: 'up_to_date',
        }),
      ).toBe('unhealthy');
    });

    it('returns degraded when migrations are pending', () => {
      expect(
        deriveOverallHealthStatus({
          api: 'up',
          database: 'up',
          migrations: 'pending',
        }),
      ).toBe('degraded');
    });
  });

  describe('resolveApplicationVersion', () => {
    it('prefers APP_VERSION over package.json', () => {
      expect(resolveApplicationVersion({ APP_VERSION: '9.9.9' }, '/nonexistent')).toBe('9.9.9');
    });
  });

  describe('runtime environment', () => {
    it('treats production as fail-hard and development as warn-only', () => {
      expect(resolveRuntimeEnvironment({ NODE_ENV: 'production' })).toBe('production');
      expect(resolveRuntimeEnvironment({ NODE_ENV: 'development' })).toBe('development');
      expect(resolveRuntimeEnvironment({ VITEST: 'true' })).toBe('test');
      expect(shouldFailStartupOnVerificationError({ NODE_ENV: 'production' })).toBe(true);
      expect(shouldFailStartupOnVerificationError({ NODE_ENV: 'development' })).toBe(false);
    });
  });

  describe('verifyConfigurationValidity', () => {
    it('requires DATABASE_URL', () => {
      const result = verifyConfigurationValidity({ NODE_ENV: 'development' });
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('DATABASE_URL is not set');
    });

    it('requires a strong JWT_SECRET in production', () => {
      const result = verifyConfigurationValidity({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost/trp',
        JWT_SECRET: 'dev-only-change-me',
      });
      expect(result.valid).toBe(false);
      expect(result.issues[0]).toMatch(/JWT_SECRET/);
    });

    it('passes with DATABASE_URL in development', () => {
      const result = verifyConfigurationValidity({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://localhost/trp',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('listLocalMigrations', () => {
    it('lists migration directories from the filesystem', () => {
      const root = mkdtempSync(join(tmpdir(), 'trp-migrations-'));
      try {
        mkdirSync(join(root, '20260101000000_init'));
        mkdirSync(join(root, '20260102000000_next'));
        writeFileSync(join(root, 'migration_lock.toml'), 'provider = "postgresql"\n');

        expect(listLocalMigrations(root)).toEqual(['20260101000000_init', '20260102000000_next']);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });

    it('resolves the repo migrations directory', () => {
      const directory = resolveMigrationsDirectory(join(__dirname, '..', '..', '..'));
      expect(listLocalMigrations(directory).length).toBeGreaterThan(0);
    });
  });

  describe('compareMigrations', () => {
    it('detects pending migrations (schema drift)', () => {
      const result = compareMigrations(
        ['20260101000000_init', '20260719213000_us018'],
        ['20260101000000_init'],
      );
      expect(result.status).toBe('pending');
      expect(result.pending).toEqual(['20260719213000_us018']);
    });

    it('detects database-only migrations as drift', () => {
      const result = compareMigrations(
        ['20260101000000_init'],
        ['20260101000000_init', '20269999000000_orphan'],
      );
      expect(result.status).toBe('drift');
    });

    it('reports up_to_date when local and applied match', () => {
      const result = compareMigrations(['20260101000000_init'], ['20260101000000_init']);
      expect(result.status).toBe('up_to_date');
    });
  });

  describe('VersionCheck', () => {
    it('reports version, environment, and uptime', () => {
      const check = new VersionCheck();
      const result = check.check({ NODE_ENV: 'development', APP_VERSION: '1.2.3' });
      expect(result.version).toBe('1.2.3');
      expect(result.environment).toBe('development');
      expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(result.startupTimestamp).toMatch(/^\d{4}-/);
    });
  });

  describe('RuntimeHealthService', () => {
    it('aggregates check results into the public health payload', async () => {
      const service = new RuntimeHealthService(
        {
          check: () => ({
            status: 'up' as const,
            initialized: true,
            controllersRegistered: 3,
            modulesRegistered: 2,
            registeredModules: ['HealthModule', 'PrismaModule'],
            detail: 'API initialized',
          }),
        } as never,
        {
          check: async () => ({
            status: 'up' as const,
            detail: 'Database reachable',
          }),
        } as never,
        {
          check: async () => ({
            status: 'pending' as const,
            pending: ['20260719213000_us018_historical_research_engine'],
            applied: [],
            local: ['20260719213000_us018_historical_research_engine'],
            detail: 'Pending migrations: 20260719213000_us018_historical_research_engine',
          }),
        } as never,
        {
          check: () => ({
            version: '0.1.0',
            environment: 'development' as const,
            startupTimestamp: '2026-07-20T00:00:00.000Z',
            uptimeSeconds: 12.5,
            detail: 'version=0.1.0 env=development',
          }),
        } as never,
      );

      const report = await service.check({ NODE_ENV: 'development' });

      expect(report).toMatchObject({
        status: 'degraded',
        version: '0.1.0',
        uptime: 12.5,
        database: 'up',
        migrations: 'pending',
        api: 'up',
        environment: 'development',
      });
      expect(report.timestamp).toMatch(/^\d{4}-/);
      expect(report.details.pendingMigrations).toEqual([
        '20260719213000_us018_historical_research_engine',
      ]);
    });

    it('createRuntimeHealthReport derives overall status', () => {
      const report = createRuntimeHealthReport({
        version: '0.1.0',
        uptime: 1,
        database: 'down',
        migrations: 'unavailable',
        api: 'up',
        timestamp: '2026-07-20T00:00:00.000Z',
        environment: 'production',
        details: {
          api: 'up',
          database: 'down',
          migrations: 'unavailable',
          version: '0.1.0',
          controllersRegistered: 1,
          pendingMigrations: [],
        },
      });
      expect(report.status).toBe('unhealthy');
    });
  });

  describe('StartupVerification', () => {
    function createVerification(overrides?: {
      databaseStatus?: 'up' | 'down';
      migrationStatus?: 'up_to_date' | 'pending' | 'drift' | 'unavailable';
      pending?: string[];
    }) {
      return new StartupVerification(
        {
          check: () => ({
            status: 'up' as const,
            initialized: true,
            controllersRegistered: 4,
            modulesRegistered: 3,
            registeredModules: ['HealthModule', 'LoggingModule', 'PrismaModule'],
            detail: 'API initialized',
          }),
        } as never,
        {
          check: async () => ({
            status: overrides?.databaseStatus ?? 'up',
            detail:
              overrides?.databaseStatus === 'down'
                ? 'Database unreachable: connection refused'
                : 'Database reachable',
          }),
        } as never,
        {
          check: async () => ({
            status: overrides?.migrationStatus ?? 'up_to_date',
            pending: overrides?.pending ?? [],
            applied: [],
            local: overrides?.pending ?? [],
            detail:
              overrides?.migrationStatus === 'pending'
                ? `Pending migrations: ${(overrides.pending ?? []).join(', ')}`
                : 'All migrations applied',
          }),
        } as never,
        new VersionCheck(),
        createLogger(),
      );
    }

    it('passes when database and migrations are healthy', async () => {
      const verification = createVerification();
      const result = await verification.verify({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://localhost/trp',
        APP_VERSION: '0.1.0',
      });
      expect(result.ok).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('warns instead of throwing in development when migrations are pending', async () => {
      const verification = createVerification({
        migrationStatus: 'pending',
        pending: ['20260719213000_us018_historical_research_engine'],
      });
      const result = await verification.verify({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://localhost/trp',
      });
      expect(result.ok).toBe(false);
      expect(result.issues[0]).toMatch(/Pending migrations/);
    });

    it('terminates startup in production when migrations are pending', async () => {
      const verification = createVerification({
        migrationStatus: 'pending',
        pending: ['20260719213000_us018_historical_research_engine'],
      });
      await expect(
        verification.verify({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://localhost/trp',
          JWT_SECRET: 'production-secret-16+',
        }),
      ).rejects.toBeInstanceOf(StartupVerificationError);
    });

    it('terminates startup in production when database is down', async () => {
      const verification = createVerification({ databaseStatus: 'down' });
      await expect(
        verification.verify({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://localhost/trp',
          JWT_SECRET: 'production-secret-16+',
        }),
      ).rejects.toThrow(/Database unreachable/);
    });
  });
});
