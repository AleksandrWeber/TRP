import { describe, expect, it } from 'vitest';
import {
  describePersistenceDriver,
  describePersistenceDrivers,
  PersistenceDriverConfigurationError,
  resolvePersistenceDriver,
  resolvePersistenceDriverForGroup,
  type PersistenceDriver,
  type PersistenceDriverSource,
} from './persistence-driver';

type EnvCase = Readonly<{
  name: string;
  global?: string;
  research?: string;
  w3?: string;
  researchDriver: PersistenceDriver;
  w3Driver: PersistenceDriver;
  researchSource: PersistenceDriverSource;
  w3Source: PersistenceDriverSource;
  researchVariable: string | null;
  w3Variable: string | null;
}>;

const PRECEDENCE: readonly EnvCase[] = [
  {
    name: 'both groups default to memory',
    researchDriver: 'memory',
    w3Driver: 'memory',
    researchSource: 'default',
    w3Source: 'default',
    researchVariable: null,
    w3Variable: null,
  },
  {
    name: 'legacy global driver applies to both groups',
    global: 'prisma',
    researchDriver: 'prisma',
    w3Driver: 'prisma',
    researchSource: 'global',
    w3Source: 'global',
    researchVariable: 'PERSISTENCE_DRIVER',
    w3Variable: 'PERSISTENCE_DRIVER',
  },
  {
    name: 'research and w3 can select different drivers',
    global: 'prisma',
    research: 'prisma',
    w3: 'memory',
    researchDriver: 'prisma',
    w3Driver: 'memory',
    researchSource: 'group',
    w3Source: 'group',
    researchVariable: 'RESEARCH_PERSISTENCE_DRIVER',
    w3Variable: 'W3_PERSISTENCE_DRIVER',
  },
  {
    name: 'group variables override the global value in either direction',
    global: 'prisma',
    research: 'memory',
    w3: 'prisma',
    researchDriver: 'memory',
    w3Driver: 'prisma',
    researchSource: 'group',
    w3Source: 'group',
    researchVariable: 'RESEARCH_PERSISTENCE_DRIVER',
    w3Variable: 'W3_PERSISTENCE_DRIVER',
  },
  {
    name: 'research override leaves w3 on the global value',
    global: 'memory',
    research: 'prisma',
    researchDriver: 'prisma',
    w3Driver: 'memory',
    researchSource: 'group',
    w3Source: 'global',
    researchVariable: 'RESEARCH_PERSISTENCE_DRIVER',
    w3Variable: 'PERSISTENCE_DRIVER',
  },
  {
    name: 'w3 override leaves research on the global value',
    global: 'memory',
    w3: 'memory',
    researchDriver: 'memory',
    w3Driver: 'memory',
    researchSource: 'global',
    w3Source: 'group',
    researchVariable: 'PERSISTENCE_DRIVER',
    w3Variable: 'W3_PERSISTENCE_DRIVER',
  },
];

function envFrom(row: Pick<EnvCase, 'global' | 'research' | 'w3'>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  if (row.global !== undefined) env.PERSISTENCE_DRIVER = row.global;
  if (row.research !== undefined) env.RESEARCH_PERSISTENCE_DRIVER = row.research;
  if (row.w3 !== undefined) env.W3_PERSISTENCE_DRIVER = row.w3;
  return env;
}

describe('persistence driver groups', () => {
  it.each(PRECEDENCE)('$name', (row) => {
    const report = describePersistenceDrivers(undefined, envFrom(row));

    expect(report.research).toEqual({
      group: 'research',
      driver: row.researchDriver,
      source: row.researchSource,
      variable: row.researchVariable,
    });
    expect(report.w3).toEqual({
      group: 'w3',
      driver: row.w3Driver,
      source: row.w3Source,
      variable: row.w3Variable,
    });
    expect(report.research.driver).toBe(
      resolvePersistenceDriverForGroup('research', undefined, envFrom(row)),
    );
    expect(report.w3.driver).toBe(resolvePersistenceDriverForGroup('w3', undefined, envFrom(row)));
  });

  it('trims whitespace and compares case-insensitively', () => {
    const report = describePersistenceDrivers(undefined, {
      PERSISTENCE_DRIVER: '  MEMORY ',
      RESEARCH_PERSISTENCE_DRIVER: '\tPrIsMa\n',
      W3_PERSISTENCE_DRIVER: '  memory',
    });

    expect(report.research).toMatchObject({
      driver: 'prisma',
      source: 'group',
      variable: 'RESEARCH_PERSISTENCE_DRIVER',
    });
    expect(report.w3).toMatchObject({
      driver: 'memory',
      source: 'group',
      variable: 'W3_PERSISTENCE_DRIVER',
    });
  });

  it('treats a whitespace-only group variable as unset and uses the global value', () => {
    const research = describePersistenceDriver('research', undefined, {
      PERSISTENCE_DRIVER: 'prisma',
      RESEARCH_PERSISTENCE_DRIVER: '   ',
    });
    expect(research).toMatchObject({
      driver: 'prisma',
      source: 'global',
      variable: 'PERSISTENCE_DRIVER',
    });
  });

  it('keeps the global resolver as the backward-compatible fallback', () => {
    expect(resolvePersistenceDriver(() => undefined, {})).toBe('memory');
    expect(
      resolvePersistenceDriver(
        (key) => (key === 'PERSISTENCE_DRIVER' ? '  Prisma ' : undefined),
        {},
      ),
    ).toBe('prisma');
    expect(resolvePersistenceDriver(undefined, { PERSISTENCE_DRIVER: '   ' })).toBe('memory');
  });

  it('rejects an invalid global value', () => {
    expect(() => resolvePersistenceDriver(undefined, { PERSISTENCE_DRIVER: 'sqlite' })).toThrow(
      PersistenceDriverConfigurationError,
    );
    expect(() => describePersistenceDrivers(undefined, { PERSISTENCE_DRIVER: 'sqlite' })).toThrow(
      /PERSISTENCE_DRIVER="sqlite"/,
    );
  });

  it('rejects an invalid research value without falling back to the global driver', () => {
    const env = { PERSISTENCE_DRIVER: 'prisma', RESEARCH_PERSISTENCE_DRIVER: 'sqlite' };
    expect(() => describePersistenceDriver('w3', undefined, env).driver).not.toThrow();
    expect(describePersistenceDriver('w3', undefined, env).driver).toBe('prisma');

    let error: unknown;
    try {
      describePersistenceDriver('research', undefined, env);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(PersistenceDriverConfigurationError);
    expect(error).toMatchObject({ variable: 'RESEARCH_PERSISTENCE_DRIVER', value: 'sqlite' });
  });

  it('rejects an invalid w3 value without falling back to the global driver', () => {
    const env = { PERSISTENCE_DRIVER: 'memory', W3_PERSISTENCE_DRIVER: 'redis' };
    expect(describePersistenceDriver('research', undefined, env).driver).toBe('memory');

    expect(() => describePersistenceDriver('w3', undefined, env)).toThrow(
      /W3_PERSISTENCE_DRIVER="redis"/,
    );
  });

  it('does not echo a database URL supplied as an invalid driver', () => {
    const secret = 'postgresql://user:secret@localhost:5432/trp?password=hunter2';
    let error: unknown;
    try {
      resolvePersistenceDriver(() => secret, {});
    } catch (caught) {
      error = caught;
    }
    const message = error instanceof Error ? `${error.message} ${JSON.stringify(error)}` : '';
    expect(error).toBeInstanceOf(PersistenceDriverConfigurationError);
    expect(message).toContain('[redacted]');
    expect(message).not.toContain('secret');
    expect(message).not.toContain('hunter2');
    expect(message).not.toContain('postgresql://');
  });
});
