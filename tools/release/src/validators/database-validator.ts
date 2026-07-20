import path from 'node:path';
import type { PhaseResult, ReleaseConfig } from '../types.js';
import { runCommand } from '../utils/shell.js';
import { pathExists } from '../utils/fs.js';
import { formatPhaseMarkdown, truncate, writeReport } from '../utils/reports.js';

export class DatabaseValidator {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const apiDir = path.join(config.rootDir, 'apps', 'api');

    if (!(await pathExists(path.join(apiDir, 'prisma', 'schema.prisma')))) {
      criticalIssues.push('apps/api/prisma/schema.prisma is missing');
    }

    const generate = await runCommand('pnpm', ['exec', 'prisma', 'generate'], {
      cwd: apiDir,
      timeoutMs: 180_000,
    });
    if (generate.exitCode !== 0) {
      criticalIssues.push(
        `prisma generate failed:\n${truncate(generate.stderr || generate.stdout)}`,
      );
    }

    const migrate = await runCommand('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      cwd: apiDir,
      timeoutMs: 300_000,
    });
    if (migrate.exitCode !== 0) {
      criticalIssues.push(
        `prisma migrate deploy failed:\n${truncate(migrate.stderr || migrate.stdout)}`,
      );
      recommendations.push('Ensure DATABASE_URL is configured and Postgres is reachable');
    }

    const status = await runCommand('pnpm', ['exec', 'prisma', 'migrate', 'status'], {
      cwd: apiDir,
      timeoutMs: 120_000,
    });
    if (status.exitCode !== 0) {
      warnings.push(`prisma migrate status exited ${status.exitCode}`);
    }
    if (/drift|diverged|pending/i.test(status.stdout + status.stderr)) {
      if (/pending/i.test(status.stdout + status.stderr) && migrate.exitCode === 0) {
        warnings.push('migrate status still reports pending/drift wording — review output');
      } else if (migrate.exitCode !== 0) {
        criticalIssues.push('Migration drift or pending migrations detected');
      }
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'database',
      name: 'Database',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? 'Prisma generate and migrate deploy succeeded.'
          : 'Database validation failed.',
      criticalIssues,
      warnings,
      recommendations,
      metrics: {
        generateExitCode: generate.exitCode,
        migrateExitCode: migrate.exitCode,
      },
    };

    const reportPath = await writeReport(
      config,
      'database.md',
      formatPhaseMarkdown('Database Validation', config, result, [
        '## migrate deploy output',
        '',
        '```',
        truncate(migrate.stdout || migrate.stderr, 2500),
        '```',
      ]),
    );
    return { ...result, reportPath };
  }
}
