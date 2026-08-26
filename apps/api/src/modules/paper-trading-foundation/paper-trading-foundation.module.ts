import { Module } from '@nestjs/common';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
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
 * W2-S04-a: Paper Account lifecycle, status, currency, balances, projection,
 * workspace ownership, and operator UI surface.
 * Does not own orders, positions, portfolio, PnL, matching, or Live Trading.
 */
@Module({
  imports: [WorkspaceModule, SecurityAuditModule],
  controllers: [PaperTradingFoundationController],
  providers: [
    {
      provide: PAPER_TRADING_ACCOUNT_STORE,
      useClass: InMemoryPaperTradingAccountStore,
    },
    PaperTradingAccountAudit,
    PaperTradingAccountService,
  ],
  exports: [PaperTradingAccountService],
})
export class PaperTradingFoundationModule {}
