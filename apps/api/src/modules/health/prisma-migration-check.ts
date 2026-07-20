import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import type { MigrationStatus } from './health-status';

export type PrismaMigrationCheckResult = Readonly<{
  status: MigrationStatus;
  pending: readonly string[];
  applied: readonly string[];
  local: readonly string[];
  detail: string;
}>;

type AppliedMigrationRow = Readonly<{
  migration_name: string;
  finished_at: Date | null;
}>;

/**
 * Compare local migration folders against applied `_prisma_migrations` rows.
 */
export function compareMigrations(
  local: readonly string[],
  applied: readonly string[],
): PrismaMigrationCheckResult {
  const appliedSet = new Set(applied);
  const localSet = new Set(local);
  const pending = local.filter((name) => !appliedSet.has(name));
  const unknownApplied = applied.filter((name) => !localSet.has(name));

  if (pending.length > 0) {
    return {
      status: 'pending',
      pending,
      applied,
      local,
      detail: `Pending migrations: ${pending.join(', ')}`,
    };
  }

  if (unknownApplied.length > 0) {
    return {
      status: 'drift',
      pending: [],
      applied,
      local,
      detail: `Database has migrations not present locally: ${unknownApplied.join(', ')}`,
    };
  }

  return {
    status: 'up_to_date',
    pending: [],
    applied,
    local,
    detail: `All ${local.length} local migration(s) applied`,
  };
}

/**
 * Detects Prisma schema / migration drift by comparing local migration
 * directories with rows in `_prisma_migrations`.
 */
@Injectable()
export class PrismaMigrationCheck {
  constructor(private readonly prisma: PrismaService) {}

  async check(
    migrationsDirectory: string = resolveMigrationsDirectory(),
  ): Promise<PrismaMigrationCheckResult> {
    let local: string[];
    try {
      local = listLocalMigrations(migrationsDirectory);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        status: 'unavailable',
        pending: [],
        applied: [],
        local: [],
        detail: `Unable to read local migrations: ${message}`,
      };
    }

    let applied: string[];
    try {
      applied = await this.listAppliedMigrations();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        status: 'unavailable',
        pending: [],
        applied: [],
        local,
        detail: `Unable to query applied migrations: ${message}`,
      };
    }

    return compareMigrations(local, applied);
  }

  private async listAppliedMigrations(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<AppliedMigrationRow[]>`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at ASC
    `;
    return rows.map((row) => row.migration_name);
  }
}

export function resolveMigrationsDirectory(cwd: string = process.cwd()): string {
  const candidates = [
    join(cwd, 'prisma', 'migrations'),
    join(cwd, 'apps', 'api', 'prisma', 'migrations'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return candidates[0]!;
}

export function listLocalMigrations(migrationsDirectory: string): string[] {
  if (!existsSync(migrationsDirectory)) {
    throw new Error(`Migrations directory not found: ${migrationsDirectory}`);
  }

  return readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}
