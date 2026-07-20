import type { HealthStatus, ComponentStatus, MigrationStatus } from './health-status';
import { deriveOverallHealthStatus } from './health-status';
import type { RuntimeEnvironment } from './runtime-environment';

export type RuntimeHealthReport = Readonly<{
  status: HealthStatus;
  version: string;
  uptime: number;
  database: ComponentStatus;
  migrations: MigrationStatus;
  api: ComponentStatus;
  timestamp: string;
  environment: RuntimeEnvironment;
  details: Readonly<{
    api: string;
    database: string;
    migrations: string;
    version: string;
    controllersRegistered: number;
    pendingMigrations: readonly string[];
  }>;
}>;

export type CreateRuntimeHealthReportInput = Readonly<{
  version: string;
  uptime: number;
  database: ComponentStatus;
  migrations: MigrationStatus;
  api: ComponentStatus;
  timestamp: string;
  environment: RuntimeEnvironment;
  details: RuntimeHealthReport['details'];
}>;

export function createRuntimeHealthReport(
  input: CreateRuntimeHealthReportInput,
): RuntimeHealthReport {
  return {
    status: deriveOverallHealthStatus({
      api: input.api,
      database: input.database,
      migrations: input.migrations,
    }),
    version: input.version,
    uptime: input.uptime,
    database: input.database,
    migrations: input.migrations,
    api: input.api,
    timestamp: input.timestamp,
    environment: input.environment,
    details: input.details,
  };
}
