import { Injectable } from '@nestjs/common';
import { resolveApplicationVersion } from './application-version';
import { resolveRuntimeEnvironment, type RuntimeEnvironment } from './runtime-environment';

export type VersionCheckResult = Readonly<{
  version: string;
  environment: RuntimeEnvironment;
  startupTimestamp: string;
  uptimeSeconds: number;
  detail: string;
}>;

/**
 * Reports application version, environment, and process uptime.
 */
@Injectable()
export class VersionCheck {
  private readonly startedAt = new Date();

  check(env: NodeJS.ProcessEnv = process.env, now: Date = new Date()): VersionCheckResult {
    const version = resolveApplicationVersion(env);
    const environment = resolveRuntimeEnvironment(env);
    const uptimeSeconds = Math.max(0, (now.getTime() - this.startedAt.getTime()) / 1000);

    return {
      version,
      environment,
      startupTimestamp: this.startedAt.toISOString(),
      uptimeSeconds,
      detail: `version=${version} env=${environment}`,
    };
  }

  getStartupTimestamp(): string {
    return this.startedAt.toISOString();
  }
}
