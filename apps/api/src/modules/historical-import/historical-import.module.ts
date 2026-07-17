import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { CsvImporter } from './csv.importer';

/**
 * Historical data import Nest module (US116).
 * Pluggable importers — CSV first. No REST / Prisma / Pipeline / Backtesting.
 */
@Module({
  imports: [MarketDataModule],
  providers: [CsvImporter],
  exports: [CsvImporter],
})
export class HistoricalImportModule {}
