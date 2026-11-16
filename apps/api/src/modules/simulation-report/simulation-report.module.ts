import { Module } from '@nestjs/common';
import { CsvSimulationReportExporter } from './csv-simulation-report.exporter';
import { HtmlSimulationReportExporter } from './html-simulation-report.exporter';
import { SimulationReportBuilder } from './simulation-report.builder';

/**
 * Simulation report Nest module (US124).
 * Immutable research simulation artifact — no UI / REST / Prisma.
 */
@Module({
  providers: [SimulationReportBuilder, CsvSimulationReportExporter, HtmlSimulationReportExporter],
  exports: [SimulationReportBuilder, CsvSimulationReportExporter, HtmlSimulationReportExporter],
})
export class SimulationReportModule {}
