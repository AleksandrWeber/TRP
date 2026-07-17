import { Module } from '@nestjs/common';
import { StrategyComparisonService } from './strategy-comparison.service';

/**
 * Strategy comparison Nest module (US123).
 * No REST / Prisma / optimization / UI.
 */
@Module({
  providers: [StrategyComparisonService],
  exports: [StrategyComparisonService],
})
export class StrategyComparisonModule {}
