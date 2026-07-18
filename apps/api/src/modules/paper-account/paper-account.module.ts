import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { PaperAccountService } from './paper-account.service';
import { PAPER_ACCOUNT_REPOSITORY } from './persistence/paper-account.repository';
import { PrismaPaperAccountRepository } from './persistence/prisma-paper-account.repository';

@Module({
  imports: [EventProcessingModule],
  providers: [
    {
      provide: PAPER_ACCOUNT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPaperAccountRepository(prisma),
      inject: [PrismaService],
    },
    PaperAccountService,
  ],
  exports: [PAPER_ACCOUNT_REPOSITORY, PaperAccountService],
})
export class PaperAccountModule {}
