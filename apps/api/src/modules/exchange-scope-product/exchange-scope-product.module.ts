import { Module } from '@nestjs/common';
import { ExchangeScopeModule } from '../exchange-scope';
import { WorkspaceModule } from '../workspace';
import { ExchangeScopeProductController } from './exchange-scope.controller';
import { ExchangeScopeProductService } from './exchange-scope-product.service';

/**
 * PC-12 — HTTP product adapter for existing Exchange Scope ports.
 *
 * Does not own isolation artifacts. Does not redesign Runtime, Session,
 * or Deployment. Domain `rest: false` is unchanged.
 */
@Module({
  imports: [ExchangeScopeModule, WorkspaceModule],
  controllers: [ExchangeScopeProductController],
  providers: [ExchangeScopeProductService],
})
export class ExchangeScopeProductModule {}
