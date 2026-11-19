import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Test } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { RepositoryPrismaLifecycleModule } from './repository-prisma-lifecycle.module';
import { RepositoryPrismaLifecycle, sanitizeLifecycleError } from './repository-prisma-lifecycle';

const FACTORY_CALLERS = [
  {
    file: 'modules/campaign-persistence/campaign-persistence.module.ts',
    group: 'research',
    calls: 1,
  },
  { file: 'modules/knowledge/knowledge.module.ts', group: 'research', calls: 1 },
  { file: 'modules/insight/insight.module.ts', group: 'research', calls: 1 },
  { file: 'modules/recommendation/recommendation.module.ts', group: 'research', calls: 1 },
  { file: 'modules/research-report/research-report.module.ts', group: 'research', calls: 1 },
  { file: 'modules/reporting/reporting.module.ts', group: 'w3', calls: 1 },
  { file: 'modules/notification-delivery/notification-delivery.module.ts', group: 'w3', calls: 1 },
  { file: 'modules/trading-orchestrator/trading-orchestrator.module.ts', group: 'w3', calls: 1 },
  { file: 'modules/knowledge-lake/knowledge-lake.module.ts', group: 'w3', calls: 1 },
  { file: 'modules/market-profile/market-profile.module.ts', group: 'w3', calls: 1 },
  { file: 'modules/market-qualification/market-qualification.module.ts', group: 'w3', calls: 1 },
  { file: 'modules/market-state/market-state.module.ts', group: 'w3', calls: 1 },
  { file: 'modules/exchange-scope/exchange-scope.module.ts', group: 'w3', calls: 1 },
  { file: 'modules/strategy-library/strategy-library.module.ts', group: 'w3', calls: 2 },
  {
    file: 'modules/runtime-enforcement/runtime-validation-product.module.ts',
    group: 'w3',
    calls: 1,
  },
] as const;

function factoryOptionBlocks(source: string): string[] {
  const token = 'createRepositoryByDriver(';
  const blocks: string[] = [];
  let from = 0;
  while (from < source.length) {
    const start = source.indexOf(token, from);
    if (start < 0) break;
    let depth = 0;
    let end = start + token.length - 1;
    for (; end < source.length; end += 1) {
      const char = source[end];
      if (char === '(') depth += 1;
      else if (char === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    blocks.push(source.slice(start + token.length, end));
    from = end + 1;
  }
  return blocks;
}

function productionSources(root: string): string[] {
  const files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'dist' || entry.name === 'node_modules') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) files.push(full);
    }
  };
  visit(root);
  return files;
}

function client(disconnect: () => Promise<void>): PrismaClient {
  return { $disconnect: disconnect } as PrismaClient;
}

describe('RepositoryPrismaLifecycle', () => {
  it('disconnects every registered client when Nest closes the module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RepositoryPrismaLifecycleModule],
    }).compile();
    const lifecycle = moduleRef.get(RepositoryPrismaLifecycle);
    const first = vi.fn(async () => undefined);
    const second = vi.fn(async () => undefined);
    await lifecycle.register(client(first));
    await lifecycle.register(client(second));

    await moduleRef.close();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('continues after one disconnect failure and hides connection secrets', async () => {
    const lifecycle = new RepositoryPrismaLifecycle();
    const disconnected: string[] = [];
    await lifecycle.register(
      client(async () => {
        throw new Error('postgresql://user:secret@localhost:5432/trp password=hunter2');
      }),
    );
    await lifecycle.register(
      client(async () => {
        disconnected.push('second');
      }),
    );

    await expect(lifecycle.onModuleDestroy()).rejects.toThrow(/\[redacted\]/);
    await expect(lifecycle.onModuleDestroy()).rejects.toThrow(/password=\[redacted\]/);
    expect(disconnected).toEqual(['second']);

    let repeated: unknown;
    try {
      await lifecycle.onModuleDestroy();
    } catch (error) {
      repeated = error;
    }
    const message = repeated instanceof Error ? repeated.message : '';
    expect(message).not.toContain('hunter2');
    expect(message).not.toContain('postgresql://');
    expect(disconnected).toEqual(['second']);
  });

  it('does not disconnect a released client again during shutdown', async () => {
    const lifecycle = new RepositoryPrismaLifecycle();
    const disconnect = vi.fn(async () => undefined);
    const prisma = client(disconnect);
    await lifecycle.register(prisma);

    await lifecycle.release(prisma);
    await lifecycle.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('wires every current factory caller to its persistence group and shared lifecycle', () => {
    const root = join(__dirname, '..');
    const callers = new Set<string>();
    for (const caller of FACTORY_CALLERS) {
      callers.add(caller.file);
      const source = readFileSync(join(root, caller.file), 'utf8');
      const blocks = factoryOptionBlocks(source);
      expect(blocks, caller.file).toHaveLength(caller.calls);
      for (const block of blocks) {
        expect(block, caller.file).toContain(`group: '${caller.group}'`);
        expect(block, caller.file).not.toContain(
          `group: '${caller.group === 'research' ? 'w3' : 'research'}'`,
        );
        expect(block, caller.file).toContain('clients');
        if (caller.group === 'research') {
          expect(block, caller.file).toContain("onHydrationFailure: 'fail'");
        } else {
          expect(block, caller.file).not.toContain("onHydrationFailure: 'fail'");
        }
      }
      expect(source, caller.file).toContain('RepositoryPrismaLifecycleModule');
      expect(source, caller.file).toContain('inject: [');
    }

    expect(FACTORY_CALLERS.reduce((sum, caller) => sum + caller.calls, 0)).toBe(16);

    const discovered = productionSources(root)
      .filter((file) => readFileSync(file, 'utf8').includes('createRepositoryByDriver({'))
      .map((file) => relative(root, file));
    expect(discovered.sort()).toEqual([...callers].sort());
  });
});

describe('sanitizeLifecycleError', () => {
  it('removes database URLs and password parameters', () => {
    const message = sanitizeLifecycleError(
      new Error('failed postgresql://user:secret@db/app?password=hunter2'),
    );
    expect(message).toBe('failed [redacted]');
    expect(message).not.toContain('hunter2');
  });
});
