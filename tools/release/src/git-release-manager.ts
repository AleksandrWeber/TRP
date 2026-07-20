import type { PhaseResult, ReleaseConfig } from './types.js';
import { runCommand } from './utils/shell.js';
import { formatPhaseMarkdown, writeReport } from './utils/reports.js';

export class GitReleaseManager {
  async run(config: ReleaseConfig, finalResult: 'PASS' | 'FAIL'): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (config.skipGit) {
      const result: PhaseResult = {
        id: 'git',
        name: 'Git Release',
        status: 'SKIP',
        durationMs: Date.now() - started,
        summary: 'Git commit/tag skipped (--no-git / CI / RELEASE_SKIP_GIT=1).',
        criticalIssues: [],
        warnings: ['Git release steps were skipped by configuration'],
        recommendations: [],
        metrics: { skipped: true },
      };
      const reportPath = await writeReport(
        config,
        'git-release.md',
        formatPhaseMarkdown('Git Release', config, result),
      );
      return { ...result, reportPath };
    }

    if (finalResult !== 'PASS') {
      const result: PhaseResult = {
        id: 'git',
        name: 'Git Release',
        status: 'PASS',
        durationMs: Date.now() - started,
        summary: 'Certification FAIL — commit and tag intentionally not created.',
        criticalIssues: [],
        warnings: ['Skipped git commit/tag because FINAL RESULT != PASS'],
        recommendations: ['Re-run pnpm release:rc after remediating failures'],
        metrics: { committed: false, tagged: false },
      };
      const reportPath = await writeReport(
        config,
        'git-release.md',
        formatPhaseMarkdown('Git Release', config, result),
      );
      return { ...result, reportPath };
    }

    const add = await runCommand('git', ['add', '.'], { cwd: config.rootDir });
    if (add.exitCode !== 0) {
      criticalIssues.push(`git add failed: ${add.stderr || add.stdout}`);
    }

    const commit = await runCommand('git', ['commit', '-m', config.commitMessage], {
      cwd: config.rootDir,
    });
    if (commit.exitCode !== 0) {
      const combined = `${commit.stdout}\n${commit.stderr}`;
      if (/nothing to commit/i.test(combined)) {
        warnings.push('Nothing to commit — working tree clean');
      } else {
        criticalIssues.push(`git commit failed: ${combined}`);
      }
    }

    const existingTag = await runCommand('git', ['rev-parse', config.tagName], {
      cwd: config.rootDir,
    });
    if (existingTag.exitCode === 0) {
      warnings.push(`Tag ${config.tagName} already exists — leaving in place`);
    } else {
      const tag = await runCommand('git', ['tag', config.tagName], { cwd: config.rootDir });
      if (tag.exitCode !== 0) {
        criticalIssues.push(`git tag failed: ${tag.stderr || tag.stdout}`);
      }
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'git',
      name: 'Git Release',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? `Release commit/tag prepared locally (${config.tagName}). Push remains manual.`
          : 'Git release steps failed.',
      criticalIssues,
      warnings,
      recommendations:
        phaseStatus === 'PASS'
          ? [
              `Review commit, then push branch and tag: git push && git push origin ${config.tagName}`,
            ]
          : recommendations,
      metrics: {
        tag: config.tagName,
        commitMessage: config.commitMessage,
      },
    };

    const reportPath = await writeReport(
      config,
      'git-release.md',
      formatPhaseMarkdown('Git Release', config, result),
    );
    return { ...result, reportPath };
  }
}
