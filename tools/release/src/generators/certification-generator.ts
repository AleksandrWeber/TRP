import type { PhaseResult, PipelineResult, ReleaseConfig } from '../types.js';
import { collectIssues } from '../types.js';
import { statusLine, writeRootReleaseDoc } from '../utils/reports.js';

const SCORECARD: ReadonlyArray<{ id: PhaseResult['id']; label: string }> = [
  { id: 'repository', label: 'Repository' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'static-analysis', label: 'Static Analysis' },
  { id: 'build', label: 'Build' },
  { id: 'database', label: 'Database' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'tests', label: 'Tests' },
  { id: 'smoke', label: 'Smoke' },
  { id: 'performance', label: 'Performance' },
  { id: 'security', label: 'Security' },
  { id: 'documentation', label: 'Documentation' },
];

export class CertificationGenerator {
  async run(config: ReleaseConfig, phases: readonly PhaseResult[]): Promise<PhaseResult> {
    const started = Date.now();
    const byId = new Map(phases.map((p) => [p.id, p]));
    const scoreLines = SCORECARD.map(({ id, label }) => {
      const phase = byId.get(id);
      return statusLine(label, phase?.status ?? 'SKIP');
    });

    const failed = SCORECARD.some(({ id }) => byId.get(id)?.status === 'FAIL');
    const finalResult = failed ? 'FAIL' : 'PASS';
    const { criticalIssues, warnings, recommendations } = collectIssues(phases);

    const body = [
      '=========================================',
      '',
      'Trading Platform V1',
      '',
      'Engineering Certification',
      '',
      '=========================================',
      '',
      ...scoreLines,
      '',
      '=========================================',
      '',
      'FINAL RESULT',
      '',
      finalResult,
      '',
      '=========================================',
      '',
      `**Date:** ${new Date().toISOString().slice(0, 10)}`,
      `**Generator:** pnpm release:rc (${config.rcLabel})`,
      `**Tag (if PASS):** \`${config.tagName}\``,
      '',
      '## Critical Issues',
      '',
      ...(criticalIssues.length > 0 ? criticalIssues.map((i) => `- ${i}`) : ['- None']),
      '',
      '## Warnings',
      '',
      ...(warnings.length > 0 ? warnings.map((w) => `- ${w}`) : ['- None']),
      '',
      '## Recommendations',
      '',
      ...(recommendations.length > 0 ? recommendations.map((r) => `- ${r}`) : ['- None']),
      '',
      '## Release Readiness',
      '',
      finalResult === 'PASS'
        ? 'READY FOR MANUAL REVIEW AND PUSH.'
        : 'NOT READY FOR RELEASE. Fix critical issues and re-run `pnpm release:rc`.',
      '',
      '## Phase Evidence',
      '',
      '| Phase | Status | Report |',
      '|-------|--------|--------|',
      ...phases.map(
        (p) => `| ${p.name} | ${p.status} | ${p.reportPath ? `\`${p.reportPath}\`` : '—'} |`,
      ),
      '',
    ].join('\n');

    const reportPath = await writeRootReleaseDoc(
      config,
      `${config.rcLabel}-CERTIFICATION.md`,
      body,
    );

    return {
      id: 'certification',
      name: 'Certification',
      status: 'PASS',
      durationMs: Date.now() - started,
      summary: `Certification report generated (${finalResult}) at ${reportPath}`,
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      reportPath,
      metrics: { finalResult },
    };
  }

  finalize(config: ReleaseConfig, phases: readonly PhaseResult[]): PipelineResult {
    const scoreFailed = SCORECARD.some(({ id }) =>
      phases.some((p) => p.id === id && p.status === 'FAIL'),
    );
    const { criticalIssues, warnings, recommendations } = collectIssues(phases);
    return {
      config,
      phases,
      finalResult: scoreFailed ? 'FAIL' : 'PASS',
      criticalIssues,
      warnings,
      recommendations,
      certificationPath: `${config.rootDir}/docs/releases/${config.rcLabel}-CERTIFICATION.md`,
      releaseNotesPath: `${config.rootDir}/docs/releases/${config.rcLabel}-RELEASE-NOTES.md`,
    };
  }
}
