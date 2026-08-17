import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspace/workspace.module';
import { SecurityAuditModule } from './security-audit.module';
import { SecurityAuditTimelineController } from './security-audit-timeline.controller';

/** HTTP composition for the S05-b timeline foundation. */
@Module({
  imports: [SecurityAuditModule, WorkspaceModule],
  controllers: [SecurityAuditTimelineController],
})
export class SecurityAuditTimelineApiModule {}
