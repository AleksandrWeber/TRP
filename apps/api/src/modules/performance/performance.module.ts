import { Module } from '@nestjs/common';
import { PerformanceAnalyzer } from './performance-analyzer';

/**
 * Performance metrics Nest module (US122).
 * No REST / Prisma / optimization / reporting UI.
 */
@Module({
  providers: [PerformanceAnalyzer],
  exports: [PerformanceAnalyzer],
})
export class PerformanceModule {}
