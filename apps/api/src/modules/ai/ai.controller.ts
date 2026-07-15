import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import type { AiTask } from './ai.types';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiGatewayService) {}

  @Post('execute')
  execute(@Body() body: { task: AiTask; context: Record<string, unknown> }) {
    return this.ai.execute({
      task: body.task,
      context: body.context ?? {},
    });
  }

  @Get('logs')
  logs(@Query('limit') limit?: string) {
    return this.ai.listLogs(limit ? Number(limit) : 50);
  }
}
