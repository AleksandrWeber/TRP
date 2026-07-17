/**
 * Persistence driver for Research OS domain repositories (US104).
 * Switch via env / ConfigService: PERSISTENCE_DRIVER=memory|prisma
 * Default: memory (preserves existing test / local behavior).
 */
export type PersistenceDriver = 'memory' | 'prisma';

export function resolvePersistenceDriver(
  get?: (key: string) => string | undefined,
): PersistenceDriver {
  const raw = (get?.('PERSISTENCE_DRIVER') ?? process.env.PERSISTENCE_DRIVER ?? 'memory')
    .trim()
    .toLowerCase();
  return raw === 'prisma' ? 'prisma' : 'memory';
}
