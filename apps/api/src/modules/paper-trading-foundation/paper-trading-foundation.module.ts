import { Module } from '@nestjs/common';
import { MarketDataFoundationModule } from '../market-data-foundation';
import { MarketSymbolCache } from '../market-data-foundation/market-symbol.cache';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { PaperOrderAudit } from './paper-order.audit';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import { PaperOrderService } from './paper-order.service';
import { InMemoryPaperOrderStore, PAPER_ORDER_STORE } from './paper-order.store';
import { PaperTradingAccountAudit } from './paper-trading-account.audit';
import { PaperTradingAccountService } from './paper-trading-account.service';
import {
  InMemoryPaperTradingAccountStore,
  PAPER_TRADING_ACCOUNT_STORE,
} from './paper-trading-account.store';
import { PaperTradingFoundationController } from './paper-trading-foundation.controller';

/**
 * Paper Trading Foundation module.
 *
 * W2-S04-a: Paper Account foundation.
 * W2-S04-b: Paper Order foundation (intent only — no execution or fills).
 */
@Module({
  imports: [WorkspaceModule, SecurityAuditModule, MarketDataFoundationModule],
  controllers: [PaperTradingFoundationController],
  providers: [
    {
      provide: PAPER_TRADING_ACCOUNT_STORE,
      useClass: InMemoryPaperTradingAccountStore,
    },
    {
      provide: PAPER_ORDER_STORE,
      useClass: InMemoryPaperOrderStore,
    },
    PaperTradingAccountAudit,
    PaperTradingAccountService,
    PaperOrderAudit,
    {
      provide: PaperOrderMarketDataGateway,
      useFactory: (symbols: MarketSymbolCache) => new PaperOrderMarketDataGateway(symbols),
      inject: [MarketSymbolCache],
    },
    PaperOrderService,
  ],
  exports: [PaperTradingAccountService, PaperOrderService],
})
export class PaperTradingFoundationModule {}
