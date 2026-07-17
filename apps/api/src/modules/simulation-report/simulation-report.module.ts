import { Module } from '@nestjs/common';
import { SimulationReportBuilder } from './simulation-report.builder';

/**
 * Simulation report Nest module (US124).
 * Immutable research simulation artifact — no UI / REST / Prisma.
 */
@Module({
  providers: [SimulationReportBuilder],
  exports: [SimulationReportBuilder],
})
export class SimulationReportModule {}
