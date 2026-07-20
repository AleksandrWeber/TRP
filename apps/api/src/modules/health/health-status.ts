export const HEALTH_STATUSES = ['ok', 'degraded', 'unhealthy'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const COMPONENT_STATUSES = ['up', 'down'] as const;
export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];

export const MIGRATION_STATUSES = ['up_to_date', 'pending', 'drift', 'unavailable'] as const;
export type MigrationStatus = (typeof MIGRATION_STATUSES)[number];

export function deriveOverallHealthStatus(input: {
  api: ComponentStatus;
  database: ComponentStatus;
  migrations: MigrationStatus;
}): HealthStatus {
  if (input.api === 'down' || input.database === 'down') {
    return 'unhealthy';
  }
  if (input.migrations === 'pending' || input.migrations === 'drift') {
    return 'degraded';
  }
  if (input.migrations === 'unavailable') {
    return 'degraded';
  }
  return 'ok';
}
