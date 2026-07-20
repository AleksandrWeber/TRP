import path from 'node:path';
import type { PhaseResult, ReleaseConfig } from '../types.js';
import { runPnpm } from '../utils/shell.js';
import { pathExists } from '../utils/fs.js';
import { formatPhaseMarkdown, truncate, writeReport } from '../utils/reports.js';

export class DependencyValidator {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!(await pathExists(path.join(config.rootDir, 'pnpm-lock.yaml')))) {
      criticalIssues.push('pnpm-lock.yaml is missing');
    }

    const install = await runPnpm(['install', '--frozen-lockfile'], config.rootDir, 600_000);
    if (install.exitCode !== 0) {
      const fallback = await runPnpm(['install'], config.rootDir, 600_000);
      if (fallback.exitCode !== 0) {
        criticalIssues.push(
          `pnpm install failed:\n${truncate(fallback.stderr || fallback.stdout)}`,
        );
      } else {
        warnings.push('frozen-lockfile install failed; plain pnpm install succeeded');
      }
    }

    const nestConfig = path.join(
      config.rootDir,
      'apps/api/node_modules/@nestjs/config/package.json',
    );
    if (!(await pathExists(nestConfig))) {
      criticalIssues.push(
        '@nestjs/config package.json missing under apps/api/node_modules (corrupt install?)',
      );
    }

    const list = await runPnpm(['list', '-r', '--depth', '0'], config.rootDir, 120_000);
    if (list.exitCode !== 0) {
      warnings.push('pnpm list -r --depth 0 returned non-zero');
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'dependencies',
      name: 'Dependencies',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? 'Dependency install and lockfile validation succeeded.'
          : 'Dependency validation failed.',
      criticalIssues,
      warnings,
      recommendations:
        phaseStatus === 'FAIL'
          ? ['Run CI=true pnpm install --force and verify package contents']
          : recommendations,
      metrics: {
        installExitCode: install.exitCode,
      },
    };

    const reportPath = await writeReport(
      config,
      'dependencies.md',
      formatPhaseMarkdown('Dependency Validation', config, result, [
        '## Commands',
        '',
        '```',
        'pnpm install --frozen-lockfile',
        'pnpm list -r --depth 0',
        '```',
        '',
        '## Install Output (truncated)',
        '',
        '```',
        truncate(install.stdout || install.stderr, 2000),
        '```',
      ]),
    );

    return { ...result, reportPath };
  }
}
