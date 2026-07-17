import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { USER_REPOSITORY } from './repositories/user.repository.token';
import { UserDomainService } from './user-domain.service';

/**
 * Identity Nest module (US105).
 * Foundation for authentication / authorization — no auth flows yet.
 * UserRepository bound to InMemory only (no Prisma in US105).
 */
@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useFactory: (metrics: Metrics) =>
        instrumentRepository(new InMemoryUserRepository(), metrics, 'user'),
      inject: [METRICS],
    },
    UserDomainService,
  ],
  exports: [UserDomainService],
})
export class IdentityModule {}
