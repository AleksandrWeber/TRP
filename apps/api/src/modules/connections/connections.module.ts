import { Module } from '@nestjs/common';
import { AiConnectivityModule } from '../ai-connectivity';
import { ExchangeConnectivityModule } from '../exchange-connectivity';
import { SecretVaultModule } from '../secret-vault';
import { FivConn04DVaultMetadataModule } from '../secret-vault/fiv-conn-04-d-vault-metadata.module';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { ConnectionsController } from './connections.controller';
import { ConnectionEnvironmentBackfillAudit } from './connection-environment-backfill-audit';
import { ConnectionLifecycleAudit } from './connection-lifecycle-audit';
import { ConnectionMigrationGateAudit } from './connection-migration-gate-audit';
import { ConnectionValidationAudit } from './connection-validation-audit';
import { CONNECTION_VALIDATOR, DeterministicConnectionValidator } from './connection-validator';
import { Conn04MigrationBoundaryService } from './conn04-migration-boundary.service';
import { ConnectionsService } from './connections.service';
import { FivConn04APreflightService } from './fiv-conn-04-a-preflight.service';
import { FivConn04DEnvironmentBackfillWrite } from './fiv-conn-04-d-environment-backfill-write';
import { Conn04SystemJobMigrationEntry } from './fiv-conn-04-d-system-job-migration-entry';
import { MIGRATION_GATE_DURABLE_AUTHORITY } from './migration-gate-durable-authority.port';
import { MIGRATION_GATE_PORT } from './migration-gate.port';
import { PrismaMigrationGateAdapter } from './prisma-migration-gate.adapter';

@Module({
  imports: [
    WorkspaceModule,
    SecretVaultModule,
    FivConn04DVaultMetadataModule,
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
    ConnectionEnvironmentBackfillAudit,
    PrismaMigrationGateAdapter,
    { provide: MIGRATION_GATE_PORT, useExisting: PrismaMigrationGateAdapter },
    {
      provide: MIGRATION_GATE_DURABLE_AUTHORITY,
      useExisting: PrismaMigrationGateAdapter,
    },
    Conn04MigrationBoundaryService,
    FivConn04DEnvironmentBackfillWrite,
    Conn04SystemJobMigrationEntry,
    FivConn04APreflightService,
  ],
  // P-D-02 (D-CONN04-PD02-IA / §16) + Stage 3 (D-CONN04-FULL-D-IA-S23-B-S3):
  // B-04, PORT, durable authority, Entry, and write-unit are module-internal only.
  // Identity factory is not exported.
  exports: [FivConn04APreflightService],
})
export class ConnectionsModule {}
