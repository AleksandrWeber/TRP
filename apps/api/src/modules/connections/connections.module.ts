import { Module } from '@nestjs/common';
import { SecretVaultModule } from '../secret-vault';
import { WorkspaceModule } from '../workspace';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';

@Module({
  imports: [WorkspaceModule, SecretVaultModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
})
export class ConnectionsModule {}
