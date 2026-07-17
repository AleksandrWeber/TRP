import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ExecuteAiBodyDto, ListAiLogsQueryDto } from '../../validation';
import { AiGatewayService } from './ai-gateway.service';

@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly ai: AiGatewayService) {}

  @Post('execute')
  execute(@Body() body: ExecuteAiBodyDto) {
    return this.ai.execute({
      task: body.task,
      context: body.context ?? {},
    });
  }

  @Get('logs')
  logs(@Query() query: ListAiLogsQueryDto) {
    return this.ai.listLogs(query.limit ?? 50);
  }
}
