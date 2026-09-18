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
import { ConnectionsService } from './connections.service';
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
  ],
  exports: [MIGRATION_GATE_PORT],
})
export class ConnectionsModule {}
