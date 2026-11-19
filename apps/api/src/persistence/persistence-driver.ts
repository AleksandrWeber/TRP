/**
 * Persistence driver selection for Research repositories and W3 analytical owners.
 *
 * Each group resolves independently:
 * 1. Its own variable, when that variable is present and valid.
 * 2. Global PERSISTENCE_DRIVER, when that variable is present and valid.
 * 3. memory.
 *
 * Research uses RESEARCH_PERSISTENCE_DRIVER. W3 uses W3_PERSISTENCE_DRIVER.
 * Values are trimmed and compared case-insensitively. Only "memory" and "prisma"
 * are valid. A non-empty invalid value throws and does not fall back.
 * Whitespace-only is treated as unset.
 *
 * ConfigModule.forRoot() copies env-file values onto process.env before feature
 * factories run. It does not declare a validation schema for these keys, so this
 * module is the configuration check. Production factories read process.env.
 * describePersistenceDrivers() reports the effective selection without env values
 * other than the driver name and the variable that won.
 */
export type PersistenceDriver = 'memory' | 'prisma';

export const PERSISTENCE_GROUPS = ['research', 'w3'] as const;
export type PersistenceGroup = (typeof PERSISTENCE_GROUPS)[number];

export const GLOBAL_PERSISTENCE_DRIVER_ENV = 'PERSISTENCE_DRIVER';
export const RESEARCH_PERSISTENCE_DRIVER_ENV = 'RESEARCH_PERSISTENCE_DRIVER';
export const W3_PERSISTENCE_DRIVER_ENV = 'W3_PERSISTENCE_DRIVER';

const GROUP_ENV: Record<PersistenceGroup, string> = {
  research: RESEARCH_PERSISTENCE_DRIVER_ENV,
  w3: W3_PERSISTENCE_DRIVER_ENV,
};

export type PersistenceDriverSource = 'group' | 'global' | 'default';

export type PersistenceDriverSelection = Readonly<{
  group: PersistenceGroup;
  driver: PersistenceDriver;
  /** Which precedence step supplied the driver. */
  source: PersistenceDriverSource;
  /** Env variable that supplied the driver, or null when the default applied. */
  variable: string | null;
}>;

export type PersistenceDriverReport = Readonly<{
  research: PersistenceDriverSelection;
  w3: PersistenceDriverSelection;
}>;

export type PersistenceEnvReader = (key: string) => string | undefined;

export class PersistenceDriverConfigurationError extends Error {
  readonly variable: string;
  /** Invalid token, with connection strings redacted. */
  readonly value: string;

  constructor(variable: string, value: string) {
    const shown = publicInvalidToken(value);
    super(`Invalid persistence driver ${variable}="${shown}". Expected "memory" or "prisma".`);
    this.name = 'PersistenceDriverConfigurationError';
    this.variable = variable;
    this.value = shown;
  }
}

function publicInvalidToken(value: string): string {
  const redacted = value
    .replace(/(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/\S+/gi, '[redacted]')
    .replace(/\b(password|pwd)=([^&\s]+)/gi, '$1=[redacted]');
  if (redacted !== value || value.includes('://')) return '[redacted]';
  return value;
}

function readEnv(
  key: string,
  get: PersistenceEnvReader | undefined,
  env: NodeJS.ProcessEnv,
): string | undefined {
  const fromReader = get?.(key);
  if (fromReader !== undefined) return fromReader;
  return env[key];
}

function parseDriver(
  variable: string,
  raw: string | undefined,
): { present: false } | { present: true; driver: PersistenceDriver } {
  if (raw === undefined) return { present: false };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { present: false };
  const normalized = trimmed.toLowerCase();
  if (normalized === 'memory' || normalized === 'prisma') {
    return { present: true, driver: normalized };
  }
  throw new PersistenceDriverConfigurationError(variable, trimmed);
}

export function describePersistenceDriver(
  group: PersistenceGroup,
  get?: PersistenceEnvReader,
  env: NodeJS.ProcessEnv = process.env,
): PersistenceDriverSelection {
  const groupVariable = GROUP_ENV[group];
  const groupDriver = parseDriver(groupVariable, readEnv(groupVariable, get, env));
  if (groupDriver.present) {
    return {
      group,
      driver: groupDriver.driver,
      source: 'group',
      variable: groupVariable,
    };
  }

  const globalDriver = parseDriver(
    GLOBAL_PERSISTENCE_DRIVER_ENV,
    readEnv(GLOBAL_PERSISTENCE_DRIVER_ENV, get, env),
  );
  if (globalDriver.present) {
    return {
      group,
      driver: globalDriver.driver,
      source: 'global',
      variable: GLOBAL_PERSISTENCE_DRIVER_ENV,
    };
  }

  return { group, driver: 'memory', source: 'default', variable: null };
}

/** Effective Research and W3 drivers, including which precedence step won. */
export function describePersistenceDrivers(
  get?: PersistenceEnvReader,
  env: NodeJS.ProcessEnv = process.env,
): PersistenceDriverReport {
  return {
    research: describePersistenceDriver('research', get, env),
    w3: describePersistenceDriver('w3', get, env),
  };
}

export function resolvePersistenceDriverForGroup(
  group: PersistenceGroup,
  get?: PersistenceEnvReader,
  env: NodeJS.ProcessEnv = process.env,
): PersistenceDriver {
  return describePersistenceDriver(group, get, env).driver;
}

/**
 * Global PERSISTENCE_DRIVER only.
 * Production factories use resolvePersistenceDriverForGroup so the groups can differ.
 * Invalid non-empty values throw. An absent or whitespace-only value is memory.
 */
export function resolvePersistenceDriver(
  get?: PersistenceEnvReader,
  env: NodeJS.ProcessEnv = process.env,
): PersistenceDriver {
  const parsed = parseDriver(
    GLOBAL_PERSISTENCE_DRIVER_ENV,
    readEnv(GLOBAL_PERSISTENCE_DRIVER_ENV, get, env),
  );
  return parsed.present ? parsed.driver : 'memory';
}
