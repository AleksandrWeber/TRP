import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiGatewayService } from './ai-gateway.service';
import { OpenRouterProvider } from './providers/openrouter.provider';

@Module({
  controllers: [AiController],
  providers: [OpenRouterProvider, AiGatewayService],
  exports: [AiGatewayService],
})
export class AiModule {}
