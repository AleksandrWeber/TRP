import { Module } from '@nestjs/common';
import { SecretVaultModule } from '../secret-vault';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { ConnectionsController } from './connections.controller';
import { ConnectionLifecycleAudit } from './connection-lifecycle-audit';
import { ConnectionValidationAudit } from './connection-validation-audit';
import { CONNECTION_VALIDATOR, DeterministicConnectionValidator } from './connection-validator';
import { ConnectionsService } from './connections.service';

@Module({
  imports: [WorkspaceModule, SecretVaultModule, SecurityAuditModule],
  controllers: [ConnectionsController],
  providers: [
    DeterministicConnectionValidator,
    { provide: CONNECTION_VALIDATOR, useExisting: DeterministicConnectionValidator },
    ConnectionLifecycleAudit,
    ConnectionValidationAudit,
    ConnectionsService,
  ],
})
export class ConnectionsModule {}
