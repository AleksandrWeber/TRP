import { Module } from '@nestjs/common';
import { CsvSimulationReportExporter } from './csv-simulation-report.exporter';
import { HtmlSimulationReportExporter } from './html-simulation-report.exporter';
import { PdfSimulationReportExporter } from './pdf-simulation-report.exporter';
import { SimulationReportBuilder } from './simulation-report.builder';

/**
 * Simulation report Nest module (US124).
 * Immutable research simulation artifact — no UI / REST / Prisma.
 */
@Module({
  providers: [
    SimulationReportBuilder,
    CsvSimulationReportExporter,
    HtmlSimulationReportExporter,
    PdfSimulationReportExporter,
  ],
  exports: [
    SimulationReportBuilder,
    CsvSimulationReportExporter,
    HtmlSimulationReportExporter,
    PdfSimulationReportExporter,
  ],
})
export class SimulationReportModule {}
