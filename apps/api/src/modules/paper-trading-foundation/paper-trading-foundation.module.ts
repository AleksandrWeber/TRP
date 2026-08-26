import { Module } from '@nestjs/common';
import { MarketDataFoundationModule } from '../market-data-foundation';
import { MarketSymbolCache } from '../market-data-foundation/market-symbol.cache';
import { MarketTickerCache } from '../market-data-foundation/market-ticker.cache';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { PaperExecutionAudit } from './paper-execution.audit';
import { PaperExecutionService } from './paper-execution.service';
import { InMemoryPaperFillStore, PAPER_FILL_STORE } from './paper-fill.store';
import { PaperOrderAudit } from './paper-order.audit';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import { PaperOrderService } from './paper-order.service';
import { InMemoryPaperOrderStore, PAPER_ORDER_STORE } from './paper-order.store';
import { PaperPortfolioAudit } from './paper-portfolio.audit';
import { PaperPortfolioService } from './paper-portfolio.service';
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
 * W2-S04-b: Paper Order foundation (intent only).
 * W2-S04-c: Paper Execution & Matching (fills from Market Data snapshots).
 * W2-S04-d: Paper Positions / Portfolio / PnL / Execution History.
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
    {
      provide: PAPER_FILL_STORE,
      useClass: InMemoryPaperFillStore,
    },
    PaperTradingAccountAudit,
    PaperTradingAccountService,
    PaperOrderAudit,
    {
      provide: PaperOrderMarketDataGateway,
      useFactory: (symbols: MarketSymbolCache, tickers: MarketTickerCache) =>
        new PaperOrderMarketDataGateway(symbols, tickers),
      inject: [MarketSymbolCache, MarketTickerCache],
    },
    PaperOrderService,
    PaperPortfolioAudit,
    PaperPortfolioService,
    PaperExecutionAudit,
    PaperExecutionService,
  ],
  exports: [
    PaperTradingAccountService,
    PaperOrderService,
    PaperExecutionService,
    PaperPortfolioService,
  ],
})
export class PaperTradingFoundationModule {}
