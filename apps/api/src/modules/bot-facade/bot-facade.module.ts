import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductFlowModule } from '../product-flow';
import { StrategyRuntimeModule } from '../strategy-runtime';
import { TradingSessionModule } from '../trading-session';
import { WorkspaceModule } from '../workspace';
import { BotFacadeService } from './bot-facade.service';
import { ExchangeScopeQueryController } from './exchange-scope-query.controller';
import { TradingSessionCommandController } from './trading-session-command.controller';
import { TradingSessionQueryController } from './trading-session-query.controller';

/**
 * RC-19 Epic 2 — Bot Facade module.
 * Product terminology over Trading Session. Not a bounded context / aggregate.
 * RC-20 Epic 2/3 / PC-13: read + create/start/lifecycle HTTP adapters for Command Center.
 * PC-15 15-a: SessionHandoffIntent consume is delegated to ProductFlowModule.
 * PC-15 15-b: Qualification → Profile publish lives in the same composition module.
 * PC-15 15-c: Reporting → AI narrative attach lives in the same composition module.
 * PC-15 15-d: Reporting → Notification deliver lives in the same composition module.
 * PC-15 15-e: Notification → in-memory Telegram adapter lives in the same composition module.
 * PC-15 15-f: Dashboard / Command Center consume existing owner reads via OperatorProjectionService.
 */
@Module({
  imports: [
    TradingSessionModule,
    StrategyRuntimeModule,
    WorkspaceModule,
    AuthModule,
    ProductFlowModule,
  ],
  controllers: [
    TradingSessionQueryController,
    TradingSessionCommandController,
    ExchangeScopeQueryController,
  ],
  providers: [BotFacadeService],
  exports: [BotFacadeService],
})
export class BotFacadeModule {}
