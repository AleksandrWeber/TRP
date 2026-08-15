import { Module } from '@nestjs/common';
import { MarketStateModule } from '../market-state';
import { WorkspaceModule } from '../workspace';
import { MarketStateProductController } from './market-state.controller';
import { MarketStateProductService } from './market-state-product.service';

/**
 * PC-10 — HTTP product adapter for existing Market State query/refresh surfaces.
 *
 * Does not own Market State. Does not classify. Does not redesign Qualification,
 * Profile, or Trading Orchestrator. Domain `rest: false` is unchanged.
 */
@Module({
  imports: [MarketStateModule, WorkspaceModule],
  controllers: [MarketStateProductController],
  providers: [MarketStateProductService],
})
export class MarketStateProductModule {}
