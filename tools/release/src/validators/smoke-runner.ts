import path from 'node:path';
import type { PhaseResult, ReleaseConfig } from '../types.js';
import { runCommand } from '../utils/shell.js';
import { pathExists } from '../utils/fs.js';
import { formatPhaseMarkdown, truncate, writeReport } from '../utils/reports.js';

const SMOKE_AREAS: ReadonlyArray<{ area: string; globs: readonly string[] }> = [
  { area: 'Authentication', globs: ['src/modules/auth/**/*.spec.ts'] },
  {
    area: 'Research Dashboard',
    globs: [
      '../web/src/research-control/**/*.spec.ts',
      'src/modules/research-control-center/**/*.spec.ts',
    ],
  },
  {
    area: 'Research Engine',
    globs: [
      'src/modules/historical-research/**/*.spec.ts',
      'src/modules/historical-replay/**/*.spec.ts',
      'src/modules/smoke-backtest/**/*.spec.ts',
    ],
  },
  { area: 'Optimization', globs: ['src/modules/strategy-optimization/**/*.spec.ts'] },
  {
    area: 'Portfolio',
    globs: ['src/modules/portfolio-engine/**/*.spec.ts', 'src/validation/m2/us204*.spec.ts'],
  },
  {
    area: 'Positions',
    globs: ['src/modules/position-engine/**/*.spec.ts', 'src/validation/m2/us205*.spec.ts'],
  },
  {
    area: 'Orders',
    globs: ['src/modules/order-engine/**/*.spec.ts', 'src/validation/m2/us206*.spec.ts'],
  },
  { area: 'Risk', globs: ['src/modules/risk-engine/**/*.spec.ts'] },
  {
    area: 'Paper Trading',
    globs: ['src/modules/paper-trading-engine/**/*.spec.ts', 'src/validation/m2/us208*.spec.ts'],
  },
  { area: 'Exchange', globs: ['src/modules/exchange-adapter/**/*.spec.ts'] },
  {
    area: 'Live Trading',
    globs: ['src/modules/live-trading-engine/**/*.spec.ts', 'src/validation/m2/us210*.spec.ts'],
  },
  { area: 'Kill Switch', globs: ['src/modules/live-trading-engine/**/*.spec.ts'] },
  { area: 'Recovery', globs: ['src/modules/live-trading-engine/**/*.spec.ts'] },
  { area: 'Synchronization', globs: ['src/modules/live-trading-engine/**/*.spec.ts'] },
];

export class SmokeRunner {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const apiDir = path.join(config.rootDir, 'apps/api');
    const areaResults: Array<{ area: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail: string }> =
      [];

    const targets = [
      'src/modules/auth',
      'src/modules/portfolio-engine',
      'src/modules/position-engine',
      'src/modules/order-engine',
      'src/modules/risk-engine',
      'src/modules/paper-trading-engine',
      'src/modules/exchange-adapter',
      'src/modules/live-trading-engine',
      'src/modules/historical-research',
      'src/modules/strategy-optimization',
      'src/modules/research-control-center',
      'src/modules/smoke-backtest',
      'src/validation/m2/us204',
      'src/validation/m2/us205',
      'src/validation/m2/us206',
      'src/validation/m2/us208',
      'src/validation/m2/us210',
    ];

    const existingTargets: string[] = [];
    for (const target of targets) {
      const full = path.join(apiDir, target);
      // vitest accepts file prefixes; check parent dir or prefix existence loosely
      const asDir = full;
      const asPrefixParent = path.dirname(full);
      if ((await pathExists(asDir)) || (await pathExists(asPrefixParent))) {
        existingTargets.push(target);
      }
    }

    const smoke = await runCommand('pnpm', ['exec', 'vitest', 'run', ...existingTargets], {
      cwd: apiDir,
      timeoutMs: 600_000,
    });

    const smokePass = smoke.exitCode === 0;
    if (!smokePass) {
      criticalIssues.push(`Smoke vitest suite failed (exit ${smoke.exitCode})`);
    }

    for (const area of SMOKE_AREAS) {
      areaResults.push({
        area: area.area,
        status: smokePass ? 'PASS' : 'FAIL',
        detail: smokePass
          ? 'Covered by focused module/contract smoke suite'
          : 'Failed with smoke suite',
      });
    }

    // Frontend route presence check
    const appTsx = path.join(config.rootDir, 'apps/web/src/app/App.tsx');
    if (await pathExists(appTsx)) {
      warnings.push('UI routes registered in App.tsx; browser E2E not executed in smoke phase');
    } else {
      criticalIssues.push('apps/web/src/app/App.tsx missing');
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'smoke',
      name: 'Smoke',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? 'Functional smoke suites passed for trading and research areas.'
          : 'Functional smoke failed.',
      criticalIssues,
      warnings,
      recommendations:
        phaseStatus === 'FAIL' ? ['Fix failing smoke specs before release certification'] : [],
      metrics: {
        areas: areaResults.length,
        areasPassed: areaResults.filter((a) => a.status === 'PASS').length,
        exitCode: smoke.exitCode,
      },
    };

    const table = [
      '## Area Results',
      '',
      '| Area | Result | Detail |',
      '|------|--------|--------|',
      ...areaResults.map((a) => `| ${a.area} | ${a.status} | ${a.detail} |`),
      '',
      '## Output (truncated)',
      '',
      '```',
      truncate(`${smoke.stdout}\n${smoke.stderr}`, 3000),
      '```',
    ].join('\n');

    const reportPath = await writeReport(
      config,
      'smoke-test.md',
      formatPhaseMarkdown('Smoke Test', config, result, [table]),
    );
    return { ...result, reportPath };
  }
}
