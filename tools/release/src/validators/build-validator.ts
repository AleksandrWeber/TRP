import type { PhaseResult, ReleaseConfig } from '../types.js';
import { runPnpm } from '../utils/shell.js';
import { formatPhaseMarkdown, truncate, writeReport } from '../utils/reports.js';

export class BuildValidator {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    const research = await runPnpm(['--filter', '@trp/research', 'build'], config.rootDir);
    const web = await runPnpm(['--filter', '@trp/web', 'build'], config.rootDir);
    const api = await runPnpm(['--filter', '@trp/api', 'build'], config.rootDir);

    if (research.exitCode !== 0) {
      criticalIssues.push(
        `@trp/research build failed:\n${truncate(research.stderr || research.stdout)}`,
      );
    }
    if (web.exitCode !== 0) {
      criticalIssues.push(`@trp/web build failed:\n${truncate(web.stderr || web.stdout)}`);
    }
    if (api.exitCode !== 0) {
      criticalIssues.push(`@trp/api build failed:\n${truncate(api.stderr || api.stdout)}`);
    }

    const combined = await runPnpm(['build'], config.rootDir);
    if (combined.exitCode !== 0 && criticalIssues.length === 0) {
      criticalIssues.push(`pnpm build failed:\n${truncate(combined.stderr || combined.stdout)}`);
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'build',
      name: 'Build',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? 'Frontend, backend, and shared packages built successfully.'
          : 'Production build failed.',
      criticalIssues,
      warnings,
      recommendations:
        phaseStatus === 'FAIL'
          ? ['Resolve TypeScript/build errors before re-running pnpm release:rc']
          : [],
      metrics: {
        researchExitCode: research.exitCode,
        webExitCode: web.exitCode,
        apiExitCode: api.exitCode,
      },
    };

    const reportPath = await writeReport(
      config,
      'build.md',
      formatPhaseMarkdown('Production Build', config, result),
    );
    return { ...result, reportPath };
  }
}
