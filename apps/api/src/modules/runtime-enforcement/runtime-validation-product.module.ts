import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { RepositoryPrismaLifecycle } from '../../persistence/repository-prisma-lifecycle';
import { RepositoryPrismaLifecycleModule } from '../../persistence/repository-prisma-lifecycle.module';
import { WorkspaceModule } from '../workspace';
import { DurableRuntimeValidationStore } from './durable-runtime-validation.store';
import { InMemoryRuntimeValidationStore } from './in-memory-runtime-validation.store';
import { RuntimeEnforcementModule } from './runtime-enforcement.module';
import { RuntimeValidationController } from './runtime-validation.controller';
import { RuntimeValidationService } from './runtime-validation.service';

/**
 * PC-04 — HTTP product adapter for Runtime Enforcement validateDeployment.
 *
 * Does not own PASS/FAIL. Does not redesign the Gate. Deployment and Session stay unchanged.
 * W3-O01-b: optional durable validation history via W3_PERSISTENCE_DRIVER
 * (PERSISTENCE_DRIVER fallback, then memory).
 */
@Module({
  imports: [RepositoryPrismaLifecycleModule, RuntimeEnforcementModule, WorkspaceModule],
  controllers: [RuntimeValidationController],
  providers: [
    {
      provide: InMemoryRuntimeValidationStore,
      useFactory: async (clients: RepositoryPrismaLifecycle) =>
        createRepositoryByDriver({
          group: 'w3',
          createMemory: () => new InMemoryRuntimeValidationStore(),
          createPrisma: (client) => new DurableRuntimeValidationStore(client),
          owner: 'runtime-enforcement',
          clients,
        }),
      inject: [RepositoryPrismaLifecycle],
    },
    RuntimeValidationService,
  ],
})
export class RuntimeValidationProductModule {}
