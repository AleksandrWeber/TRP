import { Module } from '@nestjs/common';
import { ResearchReportController } from './research-report.controller';
import { ResearchReportDomainService } from './research-report-domain.service';

/**
 * Research Report Nest module (US099, US100).
 * Domain create / getById / search / build (structured aggregation only).
 * Read-only REST via ResearchReportController.
 * No Pipeline / Prisma / Repository / Export / AI / Jobs.
 */
@Module({
  controllers: [ResearchReportController],
  providers: [ResearchReportDomainService],
  exports: [ResearchReportDomainService],
})
export class ResearchReportModule {}
