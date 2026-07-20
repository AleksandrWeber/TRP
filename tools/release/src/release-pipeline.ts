import type { PhaseResult, PipelineResult, ReleaseConfig } from './types.js';
import { RepositoryValidator } from './validators/repository-validator.js';
import { DependencyValidator } from './validators/dependency-validator.js';
import { StaticAnalysisRunner } from './validators/static-analysis-runner.js';
import { BuildValidator } from './validators/build-validator.js';
import { DatabaseValidator } from './validators/database-validator.js';
import { TestRunner } from './validators/test-runner.js';
import { ArchitectureValidator } from './validators/architecture-validator.js';
import { SmokeRunner } from './validators/smoke-runner.js';
import { PerformanceRunner } from './validators/performance-runner.js';
import { SecurityValidator } from './validators/security-validator.js';
import { DocumentationValidator } from './validators/documentation-validator.js';
import { ReleaseNotesGenerator } from './generators/release-notes-generator.js';
import { CertificationGenerator } from './generators/certification-generator.js';
import { GitReleaseManager } from './git-release-manager.js';
import { ensureReportsDir } from './utils/reports.js';

type Stage = {
  readonly name: string;
  readonly critical: boolean;
  readonly run: () => Promise<PhaseResult>;
};

export class ReleasePipeline {
  private readonly repository = new RepositoryValidator();
  private readonly dependencies = new DependencyValidator();
  private readonly staticAnalysis = new StaticAnalysisRunner();
  private readonly build = new BuildValidator();
  private readonly database = new DatabaseValidator();
  private readonly tests = new TestRunner();
  private readonly architecture = new ArchitectureValidator();
  private readonly smoke = new SmokeRunner();
  private readonly performance = new PerformanceRunner();
  private readonly security = new SecurityValidator();
  private readonly documentation = new DocumentationValidator();
  private readonly releaseNotes = new ReleaseNotesGenerator();
  private readonly certification = new CertificationGenerator();
  private readonly git = new GitReleaseManager();

  async execute(config: ReleaseConfig): Promise<PipelineResult> {
    await ensureReportsDir(config);
    const phases: PhaseResult[] = [];

    const log = (message: string) => {
      process.stdout.write(`[release:rc] ${message}\n`);
    };

    const stages: Stage[] = [
      {
        name: 'Repository Validation',
        critical: true,
        run: () => this.repository.run(config),
      },
      {
        name: 'Dependency Validation',
        critical: true,
        run: () => this.dependencies.run(config),
      },
      {
        name: 'Static Analysis',
        critical: true,
        run: () => this.staticAnalysis.run(config),
      },
      {
        name: 'Production Build',
        critical: true,
        run: () => this.build.run(config),
      },
      {
        name: 'Database Validation',
        critical: true,
        run: () => this.database.run(config),
      },
      {
        name: 'Automated Tests',
        critical: true,
        run: () => this.tests.run(config),
      },
      {
        name: 'Architecture Validation',
        critical: true,
        run: () => this.architecture.run(config),
      },
      {
        name: 'Smoke Tests',
        critical: true,
        run: () => this.smoke.run(config),
      },
      {
        name: 'Performance Smoke',
        critical: true,
        run: () => this.performance.run(config),
      },
      {
        name: 'Security Validation',
        critical: true,
        run: () => this.security.run(config),
      },
      {
        name: 'Documentation Validation',
        critical: true,
        run: () => this.documentation.run(config),
      },
    ];

    let aborted = false;
    for (const stage of stages) {
      log(`▶ ${stage.name}`);
      const result = await stage.run();
      phases.push(result);
      log(`◀ ${stage.name} → ${result.status} (${result.durationMs} ms)`);

      if (result.status === 'FAIL' && stage.critical && config.failFast) {
        aborted = true;
        log(`STOP — critical failure in ${stage.name}`);
        break;
      }
    }

    // Always generate notes + certification for partial/full runs
    log('▶ Release Notes Generation');
    phases.push(await this.releaseNotes.run(config, phases));
    log('▶ Certification Generation');
    phases.push(await this.certification.run(config, phases));

    const pipeline = this.certification.finalize(config, phases);
    log(`FINAL RESULT: ${pipeline.finalResult}`);

    if (!aborted && pipeline.finalResult === 'PASS') {
      log('▶ Git Commit / Tag');
      const gitResult = await this.git.run(config, 'PASS');
      phases.push(gitResult);
    } else {
      log('▶ Git Commit / Tag (blocked)');
      const gitResult = await this.git.run(config, 'FAIL');
      phases.push(gitResult);
    }

    return this.certification.finalize(config, phases);
  }
}
