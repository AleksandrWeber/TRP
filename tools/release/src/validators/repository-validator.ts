import path from 'node:path';
import type { PhaseResult, ReleaseConfig } from '../types.js';
import { runCommand } from '../utils/shell.js';
import { grepFiles, pathExists } from '../utils/fs.js';
import { formatPhaseMarkdown, writeReport } from '../utils/reports.js';

export class RepositoryValidator {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const status = await runCommand('git', ['status', '--porcelain'], { cwd: config.rootDir });
    const branch = await runCommand('git', ['branch', '--show-current'], { cwd: config.rootDir });
    const conflicts = await runCommand('git', ['diff', '--name-only', '--diff-filter=U'], {
      cwd: config.rootDir,
    });

    if (conflicts.exitCode === 0 && conflicts.stdout.trim().length > 0) {
      criticalIssues.push(
        `Merge conflicts present: ${conflicts.stdout.trim().replace(/\n/g, ', ')}`,
      );
    }

    const appsPath = path.join(config.rootDir, 'apps');
    const packagesPath = path.join(config.rootDir, 'packages');
    const todoMatches = await grepFiles(appsPath, /\b(TODO|FIXME|XXX|HACK)\b/);
    const packageTodos = await grepFiles(packagesPath, /\b(TODO|FIXME|XXX|HACK)\b/);
    const debuggerMatches = [
      ...(await grepFiles(appsPath, /\bdebugger\b/)),
      ...(await grepFiles(packagesPath, /\bdebugger\b/)),
    ];
    const onlyMatches = await grepFiles(appsPath, /\.(only|skip)\(/, {
      extensions: ['.ts', '.tsx'],
    });

    const todos = [...todoMatches, ...packageTodos];
    if (todos.length > 0) {
      warnings.push(`Found ${todos.length} TODO/FIXME markers in apps/packages`);
    }
    if (debuggerMatches.length > 0) {
      criticalIssues.push(`Found debugger statements (${debuggerMatches.length})`);
    }
    if (onlyMatches.some((m) => m.text.includes('.only('))) {
      criticalIssues.push('Found focused tests (.only) — remove before release');
    }

    const dirtyCount = status.stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean).length;
    if (dirtyCount > 0) {
      warnings.push(`Working tree has ${dirtyCount} dirty paths (expected pre-release)`);
    }

    if (!(await pathExists(path.join(config.rootDir, 'package.json')))) {
      criticalIssues.push('package.json missing at repository root');
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'repository',
      name: 'Repository',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? `Repository integrity checks passed on branch ${branch.stdout.trim() || '(detached)'}.`
          : 'Repository integrity checks failed.',
      criticalIssues,
      warnings,
      recommendations,
      metrics: {
        branch: branch.stdout.trim() || '(detached)',
        dirtyPaths: dirtyCount,
        todoMarkers: todos.length,
        debuggerStatements: debuggerMatches.length,
      },
    };

    const reportPath = await writeReport(
      config,
      'repository-validation.md',
      formatPhaseMarkdown('Repository Validation', config, result, [
        '## Checks',
        '',
        '- git status / untracked awareness',
        '- merge conflicts',
        '- TODO/FIXME markers',
        '- debugger / focused tests',
      ]),
    );

    return { ...result, reportPath };
  }
}
