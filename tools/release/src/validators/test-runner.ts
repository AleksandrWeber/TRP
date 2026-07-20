import type { PhaseResult, ReleaseConfig } from '../types.js';
import { runPnpm } from '../utils/shell.js';
import { formatPhaseMarkdown, truncate, writeReport } from '../utils/reports.js';

function parseVitestSummary(output: string): {
  filesPassed: number;
  filesFailed: number;
  testsPassed: number;
  testsFailed: number;
  skipped: number;
  durationSec: number | null;
} {
  const fileMatch = output.match(
    /Test Files\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed|Test Files\s+(\d+)\s+passed/g,
  );
  let filesPassed = 0;
  let filesFailed = 0;
  for (const chunk of output.split('\n')) {
    const failedPassed = chunk.match(/Test Files\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed/);
    if (failedPassed) {
      filesFailed += Number(failedPassed[1]);
      filesPassed += Number(failedPassed[2]);
      continue;
    }
    const onlyPassed = chunk.match(/Test Files\s+(\d+)\s+passed/);
    if (onlyPassed && !chunk.includes('failed')) {
      filesPassed += Number(onlyPassed[1]);
    }
  }

  let testsPassed = 0;
  let testsFailed = 0;
  let skipped = 0;
  for (const chunk of output.split('\n')) {
    const failedPassed = chunk.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed/);
    if (failedPassed) {
      testsFailed += Number(failedPassed[1]);
      testsPassed += Number(failedPassed[2]);
      continue;
    }
    const onlyPassed = chunk.match(/Tests\s+(\d+)\s+passed/);
    if (onlyPassed && !chunk.includes('failed')) {
      testsPassed += Number(onlyPassed[1]);
    }
    const skip = chunk.match(/Tests.*?(\d+)\s+skipped/);
    if (skip) skipped += Number(skip[1]);
  }

  const durationMatch = output.match(/Duration\s+([\d.]+s)/);
  void fileMatch;

  return {
    filesPassed,
    filesFailed,
    testsPassed,
    testsFailed,
    skipped,
    durationSec: durationMatch ? Number.parseFloat(durationMatch[1]!) : null,
  };
}

export class TestRunner {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    const test = await runPnpm(
      ['exec', 'turbo', 'run', 'test', '--force'],
      config.rootDir,
      900_000,
      {
        ...(process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {}),
        ...(process.env.JWT_SECRET ? { JWT_SECRET: process.env.JWT_SECRET } : {}),
        TURBO_FORCE: 'true',
      },
    );
    const output = `${test.stdout}\n${test.stderr}`;
    const summary = parseVitestSummary(output);

    if (test.exitCode !== 0) {
      criticalIssues.push(`pnpm test failed (exit ${test.exitCode})`);
    }
    if (summary.testsFailed > 0 || summary.filesFailed > 0) {
      criticalIssues.push(
        `Failed tests detected: filesFailed=${summary.filesFailed}, testsFailed=${summary.testsFailed}`,
      );
    }

    const total = summary.testsPassed + summary.testsFailed + summary.skipped;
    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'tests',
      name: 'Tests',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? `Automated test suite passed (${summary.testsPassed} tests).`
          : 'Automated tests failed.',
      criticalIssues,
      warnings,
      recommendations:
        phaseStatus === 'FAIL' ? ['Inspect turbo/vitest output and fix failing suites'] : [],
      metrics: {
        total,
        passed: summary.testsPassed,
        failed: summary.testsFailed,
        skipped: summary.skipped,
        filesPassed: summary.filesPassed,
        filesFailed: summary.filesFailed,
        exitCode: test.exitCode,
      },
    };

    const reportPath = await writeReport(
      config,
      'test-report.md',
      formatPhaseMarkdown('Test Report', config, result, [
        '## Discovery',
        '',
        'Executed via `pnpm test` (turbo → vitest across apps/packages).',
        'Covers unit, integration, contract, and available UI/component tests.',
        '',
        '## Raw Summary (truncated)',
        '',
        '```',
        truncate(output, 3000),
        '```',
      ]),
    );
    return { ...result, reportPath };
  }
}
