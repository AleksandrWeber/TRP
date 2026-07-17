/**
 * Queue driver selection (US110).
 * QUEUE_DRIVER=memory|bullmq — default memory (tests / local).
 */
export type QueueDriver = 'memory' | 'bullmq';

export function resolveQueueDriver(get?: (key: string) => string | undefined): QueueDriver {
  const raw = (get?.('QUEUE_DRIVER') ?? process.env.QUEUE_DRIVER ?? 'memory').trim().toLowerCase();
  return raw === 'bullmq' ? 'bullmq' : 'memory';
}
