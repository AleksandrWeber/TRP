import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TradingSessionModule } from '../trading-session';
import { WorkspaceModule } from '../workspace';
import { BotFacadeService } from './bot-facade.service';
import { ExchangeScopeQueryController } from './exchange-scope-query.controller';
import { TradingSessionCommandController } from './trading-session-command.controller';
import { TradingSessionQueryController } from './trading-session-query.controller';

/**
 * RC-19 Epic 2 — Bot Facade module.
 * Product terminology over Trading Session. Not a bounded context / aggregate.
 * RC-20 Epic 2/3: read + lifecycle command HTTP adapters for Command Center.
 */
@Module({
  imports: [TradingSessionModule, WorkspaceModule, AuthModule],
  controllers: [
    TradingSessionQueryController,
    TradingSessionCommandController,
    ExchangeScopeQueryController,
  ],
  providers: [BotFacadeService],
  exports: [BotFacadeService],
})
export class BotFacadeModule {}
