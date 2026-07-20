#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReleaseConfig, parseArgv } from './utils/config.js';
import { ReleasePipeline } from './release-pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp(): void {
  process.stdout.write(`Trading Platform Engineering Release Pipeline (RC-2)

Usage:
  pnpm release:rc [-- --no-git] [-- --no-fail-fast]

Environment:
  RELEASE_RC_VERSION       RC number (default: 1)
  RELEASE_TAG              Git tag (default: v1.0.0-rc1)
  RELEASE_COMMIT_MESSAGE   Commit message override
  RELEASE_SKIP_GIT=1       Skip commit/tag (also default in CI)

Phases:
  Repository → Dependencies → Static Analysis → Build → Database → Tests
  → Architecture → Smoke → Performance → Security → Documentation
  → Release Notes → Certification → Git Commit/Tag (PASS only)
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const args = parseArgv(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const rootDir = path.resolve(__dirname, '../../..');
  const config = createReleaseConfig(rootDir, argv);
  const pipeline = new ReleasePipeline();
  const result = await pipeline.execute(config);

  process.stdout.write('\n');
  process.stdout.write(`Certification: ${result.certificationPath}\n`);
  process.stdout.write(`Release notes: ${result.releaseNotesPath}\n`);
  process.stdout.write(`FINAL RESULT: ${result.finalResult}\n`);

  process.exit(result.finalResult === 'PASS' ? 0 : 1);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`[release:rc] FATAL: ${message}\n`);
  process.exit(1);
});
