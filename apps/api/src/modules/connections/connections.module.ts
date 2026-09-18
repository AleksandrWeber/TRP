import { Module } from '@nestjs/common';
import { AiConnectivityModule } from '../ai-connectivity';
import { ExchangeConnectivityModule } from '../exchange-connectivity';
import { SecretVaultModule } from '../secret-vault';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { ConnectionsController } from './connections.controller';
import { ConnectionLifecycleAudit } from './connection-lifecycle-audit';
import { ConnectionMigrationGateAudit } from './connection-migration-gate-audit';
import { ConnectionValidationAudit } from './connection-validation-audit';
import { CONNECTION_VALIDATOR, DeterministicConnectionValidator } from './connection-validator';
import { Conn04MigrationBoundaryService } from './conn04-migration-boundary.service';
import { ConnectionsService } from './connections.service';
import { MIGRATION_GATE_DURABLE_AUTHORITY } from './migration-gate-durable-authority.port';
import { MIGRATION_GATE_PORT } from './migration-gate.port';
import { PrismaMigrationGateAdapter } from './prisma-migration-gate.adapter';

@Module({
  imports: [
    WorkspaceModule,
    SecretVaultModule,
    SecurityAuditModule,
    ExchangeConnectivityModule,
    AiConnectivityModule,
  ],
  controllers: [ConnectionsController],
  providers: [
    DeterministicConnectionValidator,
    { provide: CONNECTION_VALIDATOR, useExisting: DeterministicConnectionValidator },
    ConnectionLifecycleAudit,
    ConnectionValidationAudit,
    ConnectionsService,
    ConnectionMigrationGateAudit,
    PrismaMigrationGateAdapter,
    { provide: MIGRATION_GATE_PORT, useExisting: PrismaMigrationGateAdapter },
    {
      provide: MIGRATION_GATE_DURABLE_AUTHORITY,
      useExisting: PrismaMigrationGateAdapter,
    },
    Conn04MigrationBoundaryService,
  ],
  exports: [
    MIGRATION_GATE_PORT,
    MIGRATION_GATE_DURABLE_AUTHORITY,
    Conn04MigrationBoundaryService,
  ],
})
export class ConnectionsModule {}
