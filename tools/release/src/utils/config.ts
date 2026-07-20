import path from 'node:path';
import type { ReleaseConfig } from '../types.js';

export function createReleaseConfig(rootDir: string, argv: readonly string[]): ReleaseConfig {
  const cleaned = argv.filter((arg) => arg !== '--');
  const skipGitFlag =
    cleaned.includes('--no-git') ||
    cleaned.includes('--skip-git') ||
    process.env.RELEASE_SKIP_GIT === '1';
  const forceGit = cleaned.includes('--git') || process.env.RELEASE_SKIP_GIT === '0';
  const skipGit = forceGit ? false : skipGitFlag || process.env.CI === 'true';

  const rcVersion = process.env.RELEASE_RC_VERSION ?? '1';
  const product = process.env.RELEASE_PRODUCT_NAME ?? 'Trading Platform V1';

  return {
    rootDir,
    rcVersion,
    rcLabel: `RC-${rcVersion}`,
    tagName: process.env.RELEASE_TAG ?? `v1.0.0-rc${rcVersion}`,
    commitMessage: process.env.RELEASE_COMMIT_MESSAGE ?? `release(rc-${rcVersion}): ${product}`,
    reportsDir: path.join(rootDir, 'docs', 'releases', `rc-${rcVersion}`),
    skipGit,
    failFast: !cleaned.includes('--no-fail-fast'),
  };
}

export function parseArgv(argv: readonly string[]): {
  help: boolean;
  skipGit: boolean;
} {
  const cleaned = argv.filter((arg) => arg !== '--');
  return {
    help: cleaned.includes('--help') || cleaned.includes('-h'),
    skipGit: cleaned.includes('--no-git') || cleaned.includes('--skip-git'),
  };
}
