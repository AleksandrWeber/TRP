import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../storage/prisma/prisma.module';
import type { DomainEvent, EventHandler } from './event.types';

@Injectable()
export class EventBus implements OnModuleInit {
  private readonly logger = new Logger(EventBus.name);
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.on('*', async (event) => {
      this.logger.log(`Event ${event.type} (${event.id})`);
      await this.prisma.domainEventLog.create({
        data: {
          id: event.id,
          type: event.type,
          correlationId: event.correlationId,
          payload: event.payload as Prisma.InputJsonValue,
        },
      });
    });
  }

  on(type: string, handler: EventHandler) {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  async publish(
    type: string,
    payload: Record<string, unknown>,
    correlationId?: string,
  ): Promise<DomainEvent> {
    const event: DomainEvent = {
      id: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      correlationId,
      payload,
    };

    const typed = this.handlers.get(type) ?? [];
    const wildcards = this.handlers.get('*') ?? [];

    for (const handler of [...wildcards, ...typed]) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(
          `Handler failed for ${type}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return event;
  }

  listLogs(limit = 50) {
    return this.prisma.domainEventLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
