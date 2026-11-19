import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';

/**
 * Clients created by createRepositoryByDriver().
 * The Nest provider is the single owner inside one application.
 */
export interface RepositoryPrismaClients {
  register(client: PrismaClient): void;
  release(client: PrismaClient): Promise<void>;
}

/**
 * Disconnects factory-created Prisma clients when Nest destroys the application.
 * Same OnModuleDestroy hook PrismaService already uses. This provider does not
 * open its own database connection and does not replace PrismaService.
 */
@Injectable()
export class RepositoryPrismaLifecycle implements RepositoryPrismaClients, OnModuleDestroy {
  private readonly clients = new Set<PrismaClient>();
  private closed = false;
  private shutdown: Promise<void> | null = null;

  register(client: PrismaClient): void {
    if (this.clients.has(client)) return;
    if (this.closed) {
      void client.$disconnect().catch(() => undefined);
      return;
    }
    this.clients.add(client);
  }

  async release(client: PrismaClient): Promise<void> {
    if (!this.clients.delete(client)) return;
    await client.$disconnect().catch(() => undefined);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.shutdown) return this.shutdown;
    this.closed = true;
    const pending = [...this.clients];
    this.clients.clear();
    this.shutdown = this.disconnectAll(pending);
    return this.shutdown;
  }

  private async disconnectAll(clients: readonly PrismaClient[]): Promise<void> {
    const failures: string[] = [];
    await Promise.all(
      clients.map(async (client) => {
        try {
          await client.$disconnect();
        } catch (error) {
          failures.push(sanitizeLifecycleError(error));
        }
      }),
    );
    if (failures.length > 0) {
      throw new Error(
        `Repository Prisma clients failed to disconnect (${failures.length}): ${failures.join('; ')}`,
      );
    }
  }
}

export function sanitizeLifecycleError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'disconnect-failed';
  return message
    .replace(/(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/\S+/gi, '[redacted]')
    .replace(/\b(password|pwd)=([^&\s]+)/gi, '$1=[redacted]');
}
