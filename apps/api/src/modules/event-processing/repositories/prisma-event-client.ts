import type { Prisma } from '@prisma/client';

export type PrismaOutboxClient = Pick<Prisma.TransactionClient, 'outboxEvent'>;
export type PrismaInboxClient = Pick<Prisma.TransactionClient, 'inboxRecord'>;
export type PrismaConsumerCheckpointClient = Pick<
  Prisma.TransactionClient,
  'consumerCheckpointRecord'
>;
