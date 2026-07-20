import path from 'node:path';
import type { PhaseResult, ReleaseConfig } from '../types.js';
import { pathExists } from '../utils/fs.js';
import { formatPhaseMarkdown, writeReport } from '../utils/reports.js';

const REQUIRED_DOCS: ReadonlyArray<{ label: string; paths: readonly string[] }> = [
  { label: 'README', paths: ['README.md', 'docs/README.md'] },
  {
    label: 'Architecture',
    paths: ['docs/Architecture', 'docs/02-architecture.md', 'docs/CANONICAL.md'],
  },
  {
    label: 'Deployment',
    paths: ['docs/Architecture/019-Deployment.md', 'infrastructure/README.md'],
  },
  {
    label: 'Environment Variables',
    paths: ['.env.example'],
  },
  {
    label: 'API',
    paths: ['docs/project/api.md', 'docs/Architecture/016 API Architecture.md'],
  },
  {
    label: 'Release Notes',
    paths: ['docs/releases/RC-1-RELEASE-NOTES.md', 'CHANGELOG.md'],
  },
  {
    label: 'Migration Notes',
    paths: ['apps/api/prisma/migrations'],
  },
  {
    label: 'Known Limitations',
    paths: [
      'docs/Implementation/019-MVP-Checklist.md',
      'docs/project/technical-debt.md',
      'docs/releases/RC-1-RELEASE-NOTES.md',
    ],
  },
];

const RECOMMENDED_DOCS: ReadonlyArray<{ label: string; paths: readonly string[] }> = [
  {
    label: 'Trading Platform V1 Architecture (US204–US210)',
    paths: [
      'docs/Architecture/048-Trading-Platform-V1.md',
      'docs/Architecture/041-US204-Portfolio-Engine.md',
    ],
  },
];

export class DocumentationValidator {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const rows: Array<{ label: string; status: string; found: string }> = [];

    for (const doc of REQUIRED_DOCS) {
      const foundPaths: string[] = [];
      for (const rel of doc.paths) {
        const full = path.join(config.rootDir, rel);
        if (await pathExists(full)) foundPaths.push(rel);
      }

      if (foundPaths.length === 0) {
        if (doc.label === 'Release Notes') {
          warnings.push(
            'Release notes file not found yet — generator will create it later in pipeline',
          );
          rows.push({ label: doc.label, status: 'WARN', found: 'pending generator' });
        } else {
          rows.push({ label: doc.label, status: 'FAIL', found: '—' });
          criticalIssues.push(`Missing required documentation: ${doc.label}`);
        }
      } else {
        rows.push({ label: doc.label, status: 'PASS', found: foundPaths.join(', ') });
      }
    }

    for (const doc of RECOMMENDED_DOCS) {
      const foundPaths: string[] = [];
      for (const rel of doc.paths) {
        if (await pathExists(path.join(config.rootDir, rel))) foundPaths.push(rel);
      }
      if (foundPaths.length === 0) {
        warnings.push(`Recommended docs missing: ${doc.label}`);
        recommendations.push(`Add ${doc.label} documentation for stronger release readiness`);
        rows.push({ label: doc.label, status: 'WARN', found: '—' });
      } else {
        rows.push({ label: doc.label, status: 'PASS', found: foundPaths.join(', ') });
      }
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';

    const result: PhaseResult = {
      id: 'documentation',
      name: 'Documentation',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? 'Required documentation set is present.'
          : 'Documentation validation failed — required docs missing.',
      criticalIssues,
      warnings,
      recommendations,
      metrics: {
        required: REQUIRED_DOCS.length,
        passed: rows.filter((r) => r.status === 'PASS').length,
        failed: rows.filter((r) => r.status === 'FAIL').length,
      },
    };

    const table = [
      '## Inventory',
      '',
      '| Document | Status | Found |',
      '|----------|--------|-------|',
      ...rows.map((r) => `| ${r.label} | ${r.status} | ${r.found} |`),
    ].join('\n');

    const reportPath = await writeReport(
      config,
      'documentation.md',
      formatPhaseMarkdown('Documentation Validation', config, result, [table]),
    );
    return { ...result, reportPath };
  }
}
