import { Module } from '@nestjs/common';
import { MarketQualificationModule } from '../market-qualification';
import { WorkspaceModule } from '../workspace';
import { QualificationProductController } from './qualification.controller';
import { QualificationProductService } from './qualification-product.service';

/**
 * PC-08 — HTTP product adapter for existing Market Qualification ports.
 *
 * Does not own qualification artifacts. Does not redesign Profile or Market State.
 * Domain `rest: false` is unchanged.
 */
@Module({
  imports: [MarketQualificationModule, WorkspaceModule],
  controllers: [QualificationProductController],
  providers: [QualificationProductService],
})
export class QualificationProductModule {}
