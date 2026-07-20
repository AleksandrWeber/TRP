import type { PhaseResult, ReleaseConfig } from '../types.js';
import { runPnpm } from '../utils/shell.js';
import { formatPhaseMarkdown, truncate, writeReport } from '../utils/reports.js';

export class StaticAnalysisRunner {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const lint = await runPnpm(['lint'], config.rootDir, 600_000);
    const typecheck = await runPnpm(['typecheck'], config.rootDir, 600_000);
    const format = await runPnpm(['format:check'], config.rootDir, 600_000);

    if (lint.exitCode !== 0) {
      criticalIssues.push(`pnpm lint failed:\n${truncate(lint.stderr || lint.stdout)}`);
    }
    if (typecheck.exitCode !== 0) {
      criticalIssues.push(
        `pnpm typecheck failed:\n${truncate(typecheck.stderr || typecheck.stdout)}`,
      );
    }
    if (format.exitCode !== 0) {
      criticalIssues.push(`pnpm format:check failed:\n${truncate(format.stderr || format.stdout)}`);
      recommendations.push('Run pnpm format and re-try release');
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'static-analysis',
      name: 'Static Analysis',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? 'Lint, typecheck, and format checks passed.'
          : 'One or more static analysis checks failed.',
      criticalIssues,
      warnings,
      recommendations,
      metrics: {
        lintExitCode: lint.exitCode,
        typecheckExitCode: typecheck.exitCode,
        formatExitCode: format.exitCode,
      },
    };

    const reportPath = await writeReport(
      config,
      'static-analysis.md',
      formatPhaseMarkdown('Static Analysis', config, result),
    );
    return { ...result, reportPath };
  }
}
