import { Module } from '@nestjs/common';
import { PaperBinanceAdapter } from './adapters/paper-binance.adapter';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { RiskService } from './risk.service';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService, RiskService, PaperBinanceAdapter],
})
export class ProductionModule {}
