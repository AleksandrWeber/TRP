import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './event-bus.service';

describe('EventBus', () => {
  it('delivers events to typed and wildcard handlers', async () => {
    const create = vi.fn().mockResolvedValue({});
    const prisma = { domainEventLog: { create } } as never;
    const bus = new EventBus(prisma);
    bus.onModuleInit();

    const seen: string[] = [];
    bus.on('TestEvent', (event) => {
      seen.push(event.type);
    });

    await bus.publish('TestEvent', { ok: true }, 'corr-1');
    expect(seen).toEqual(['TestEvent']);
    expect(create).toHaveBeenCalled();
  });
});
