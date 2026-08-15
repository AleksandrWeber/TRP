import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace';
import { TradingOrchestratorController } from './trading-orchestrator.controller';
import { TradingOrchestratorModule } from './trading-orchestrator.module';
import { TradingOrchestratorProductService } from './trading-orchestrator-product.service';

/**
 * PC-11 — HTTP product adapter for Trading Orchestrator service/query ports.
 *
 * Does not own Session. Does not redesign coordination. Deployment and Runtime stay unchanged.
 */
@Module({
  imports: [TradingOrchestratorModule, AuthModule, WorkspaceModule],
  controllers: [TradingOrchestratorController],
  providers: [TradingOrchestratorProductService],
})
export class TradingOrchestratorProductModule {}
