import { Module } from '@nestjs/common';
import { MarketProfileModule } from '../market-profile';
import { WorkspaceModule } from '../workspace';
import { MarketProfileProductController } from './market-profile.controller';
import { MarketProfileProductService } from './market-profile-product.service';

/**
 * PC-09 — HTTP product adapter for existing Market Profile query ports.
 *
 * Does not own profile versions. Does not publish. Does not redesign Qualification or Market State.
 * Domain `rest: false` is unchanged.
 */
@Module({
  imports: [MarketProfileModule, WorkspaceModule],
  controllers: [MarketProfileProductController],
  providers: [MarketProfileProductService],
})
export class MarketProfileProductModule {}
