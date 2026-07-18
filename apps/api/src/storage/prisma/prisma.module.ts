import { Global, Injectable, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from './prisma-client.token';
import { PrismaTransactionService } from './prisma-transaction.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: PRISMA_CLIENT, useExisting: PrismaService },
    PrismaTransactionService,
  ],
  exports: [PrismaService, PRISMA_CLIENT, PrismaTransactionService],
})
export class PrismaModule {}
