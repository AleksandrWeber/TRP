import { Module } from '@nestjs/common';
import { RepositoryPrismaLifecycle } from './repository-prisma-lifecycle';

/**
 * One lifecycle owner for every createRepositoryByDriver() client.
 * Nest shares this module across the feature modules that import it.
 */
@Module({
  providers: [RepositoryPrismaLifecycle],
  exports: [RepositoryPrismaLifecycle],
})
export class RepositoryPrismaLifecycleModule {}
