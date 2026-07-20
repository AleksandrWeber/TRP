import path from 'node:path';
import type { PhaseResult, ReleaseConfig } from '../types.js';
import { grepFiles, pathExists, readText } from '../utils/fs.js';
import { runCommand } from '../utils/shell.js';
import { formatPhaseMarkdown, writeReport } from '../utils/reports.js';

export class SecurityValidator {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const gitEnv = await runCommand('git', ['ls-files', '.env', '.env.local', '.env.production'], {
      cwd: config.rootDir,
    });
    if (gitEnv.stdout.trim().length > 0) {
      criticalIssues.push(`Tracked env files: ${gitEnv.stdout.trim().replace(/\n/g, ', ')}`);
    }

    const gitignore = (await pathExists(path.join(config.rootDir, '.gitignore')))
      ? await readText(path.join(config.rootDir, '.gitignore'))
      : '';
    if (!gitignore.includes('.env')) {
      criticalIssues.push('.gitignore does not ignore .env');
    }

    const secretMatches = await grepFiles(
      path.join(config.rootDir, 'apps'),
      /(api[_-]?key\s*[:=]\s*['"][^'"]+['"]|password\s*[:=]\s*['"][^'"]+['"]|BEGIN (RSA |OPENSSH )?PRIVATE KEY|sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})/i,
      { maxMatches: 50 },
    );
    const filteredSecrets = secretMatches.filter(
      (m) =>
        !m.file.includes('.spec.') && !m.file.includes('.test.') && !m.file.includes('.example'),
    );
    if (filteredSecrets.length > 0) {
      criticalIssues.push(
        `Potential secrets in source (${filteredSecrets.length}): ${filteredSecrets
          .slice(0, 5)
          .map((m) => path.relative(config.rootDir, m.file))
          .join(', ')}`,
      );
    }

    const mainTs = path.join(config.rootDir, 'apps/api/src/main.ts');
    const appModule = path.join(config.rootDir, 'apps/api/src/app.module.ts');
    const mainText = (await pathExists(mainTs)) ? await readText(mainTs) : '';
    const appText = (await pathExists(appModule)) ? await readText(appModule) : '';
    const apiPkg = (await pathExists(path.join(config.rootDir, 'apps/api/package.json')))
      ? await readText(path.join(config.rootDir, 'apps/api/package.json'))
      : '';

    if (!/JwtAuthGuard/.test(appText)) {
      criticalIssues.push('JwtAuthGuard is not registered as a global guard');
    } else {
      // pass
    }

    if (!/RolesGuard/.test(appText)) {
      warnings.push('RolesGuard not detected in app.module.ts');
    }

    if (!/enableCors\(/.test(mainText)) {
      criticalIssues.push('CORS is not configured in main.ts');
    }

    const helmetPresent =
      /helmet/i.test(mainText) || /@fastify\/helmet/.test(apiPkg) || /helmet/.test(apiPkg);
    if (!helmetPresent) {
      criticalIssues.push('Helmet (or @fastify/helmet) is not enabled');
      recommendations.push('Add @fastify/helmet in API bootstrap');
    }

    const rateLimitPresent =
      /@nestjs\/throttler/.test(apiPkg) ||
      /@fastify\/rate-limit/.test(apiPkg) ||
      /ThrottlerModule|rateLimit|rate-limit/.test(mainText + appText);
    if (!rateLimitPresent) {
      criticalIssues.push('Inbound API rate limiting is not configured');
      recommendations.push('Add @nestjs/throttler or @fastify/rate-limit');
    }

    const authService = path.join(
      config.rootDir,
      'apps/api/src/modules/auth/authentication.service.ts',
    );
    if (await pathExists(authService)) {
      const authText = await readText(authService);
      if (
        /login\(email:\s*string\)/.test(authText) &&
        !/bcrypt\.compare|passwordHash/.test(authText)
      ) {
        criticalIssues.push('Authentication login appears passwordless');
      }
    }

    const debugMatches = await grepFiles(
      path.join(config.rootDir, 'apps/api/src'),
      /@Controller\(['"]debug['"]\)|SwaggerModule/,
    );
    if (debugMatches.length > 0) {
      warnings.push('Debug/Swagger controllers detected — confirm production gating');
    }

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'security',
      name: 'Security',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? 'Security baseline checks passed.'
          : 'Security baseline validation failed.',
      criticalIssues,
      warnings,
      recommendations,
      metrics: {
        secretHits: filteredSecrets.length,
        helmet: helmetPresent,
        rateLimit: rateLimitPresent,
      },
    };

    const reportPath = await writeReport(
      config,
      'security.md',
      formatPhaseMarkdown('Security Validation', config, result),
    );
    return { ...result, reportPath };
  }
}
