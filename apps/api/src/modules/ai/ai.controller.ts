import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ExecuteAiBodyDto, ListAiLogsQueryDto } from '../../validation';
import { AiGatewayService } from './ai-gateway.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

@Controller({ path: 'ai', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class AiController {
  constructor(private readonly ai: AiGatewayService) {}

  @RequirePermission(PermissionClass.Research)
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
