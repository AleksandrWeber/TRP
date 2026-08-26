import { Module } from '@nestjs/common';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { OperationalContinuityAudit } from './operational-continuity-audit';
import { OperationalContinuityController } from './operational-continuity.controller';
import { OperationalContinuityService } from './operational-continuity.service';

/**
 * W3-O01-d — Operational Continuity Foundation (outcomes / projection only).
 * Does not own persistence, recovery engines, or monitoring products.
 */
@Module({
  imports: [WorkspaceModule, SecurityAuditModule],
  controllers: [OperationalContinuityController],
  providers: [OperationalContinuityAudit, OperationalContinuityService],
  exports: [OperationalContinuityService],
})
export class OperationalContinuityModule {}
