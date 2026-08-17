import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { SecurityAuditModule } from '../security-audit';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PeopleController } from './people.controller';
import { USER_REPOSITORY } from './repositories/user.repository.token';
import { UserDomainService } from './user-domain.service';

/**
 * Identity Nest module (US105 / PC-18).
 * Durable User persistence on the existing Prisma User table.
 * Authentication owns credentials; Identity remains password-free.
 * Development bootstrap is not part of the product path.
 */
@Module({
  imports: [PrismaModule, SecurityAuditModule],
  controllers: [PeopleController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useFactory: (prisma: PrismaService, metrics: Metrics) =>
        instrumentRepository(new PrismaUserRepository(prisma), metrics, 'user'),
      inject: [PrismaService, METRICS],
    },
    UserDomainService,
  ],
  exports: [UserDomainService],
})
export class IdentityModule {}
