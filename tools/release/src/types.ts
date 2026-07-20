export type PhaseStatus = 'PASS' | 'FAIL' | 'SKIP';

export type PhaseId =
  | 'repository'
  | 'dependencies'
  | 'static-analysis'
  | 'build'
  | 'database'
  | 'tests'
  | 'architecture'
  | 'smoke'
  | 'performance'
  | 'security'
  | 'documentation'
  | 'release-notes'
  | 'certification'
  | 'git';

export interface PhaseResult {
  readonly id: PhaseId;
  readonly name: string;
  readonly status: PhaseStatus;
  readonly durationMs: number;
  readonly summary: string;
  readonly criticalIssues: readonly string[];
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
  readonly metrics?: Readonly<Record<string, string | number | boolean>>;
  readonly reportPath?: string;
}

export interface ReleaseConfig {
  readonly rootDir: string;
  readonly rcVersion: string;
  readonly rcLabel: string;
  readonly tagName: string;
  readonly commitMessage: string;
  readonly reportsDir: string;
  readonly skipGit: boolean;
  readonly failFast: boolean;
}

export interface PipelineResult {
  readonly config: ReleaseConfig;
  readonly phases: readonly PhaseResult[];
  readonly finalResult: PhaseStatus;
  readonly criticalIssues: readonly string[];
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
  readonly certificationPath: string;
  readonly releaseNotesPath: string;
}

export function isPass(result: PhaseResult): boolean {
  return result.status === 'PASS' || result.status === 'SKIP';
}

export function collectIssues(phases: readonly PhaseResult[]): {
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
} {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  for (const phase of phases) {
    for (const issue of phase.criticalIssues) {
      criticalIssues.push(`[${phase.name}] ${issue}`);
    }
    for (const warning of phase.warnings) {
      warnings.push(`[${phase.name}] ${warning}`);
    }
    for (const recommendation of phase.recommendations) {
      recommendations.push(`[${phase.name}] ${recommendation}`);
    }
  }
  return { criticalIssues, warnings, recommendations };
}
