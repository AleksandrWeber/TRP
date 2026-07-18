import { Inject, Injectable } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from './prisma-client.token';

declare const transactionContextBrand: unique symbol;

/**
 * Opaque transaction context shared across repository ports.
 * Domain/application services can coordinate one transaction without gaining
 * direct access to another module's Prisma models.
 */
export type TransactionContext = Readonly<{
  [transactionContextBrand]: true;
}>;

const clients = new WeakMap<TransactionContext, Prisma.TransactionClient>();

@Injectable()
export class PrismaTransactionService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  run<T>(work: (context: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (client) => {
      const context = Object.freeze({}) as TransactionContext;
      clients.set(context, client);
      return work(context);
    });
  }
}

/**
 * Adapter-only bridge. Domain/application code must keep TransactionContext opaque.
 */
export function prismaClientForTransaction(context: TransactionContext): Prisma.TransactionClient {
  const client = clients.get(context);
  if (!client) throw new Error('transaction context is not active');
  return client;
}
