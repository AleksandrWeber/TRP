import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import type { AiRequest, AiResponse } from './ai.types';
import { buildPrompt } from './prompts/templates';
import { OpenRouterProvider } from './providers/openrouter.provider';

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private readonly provider: OpenRouterProvider,
    private readonly prisma: PrismaService,
  ) {}

  async execute(request: AiRequest): Promise<AiResponse> {
    const started = Date.now();
    const { system, user } = buildPrompt(request.task, request.context);

    if (!this.provider.isConfigured()) {
      const content = this.offlineSummary(request);
      await this.log(request.task, 'offline', 'n/a', true, Date.now() - started);
      return { content, provider: 'offline', model: 'n/a' };
    }

    try {
      const result = await this.provider.complete(system, user);
      await this.log(request.task, this.provider.name, result.model, true, Date.now() - started);
      return {
        content: result.content,
        provider: this.provider.name,
        model: result.model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI request failed: ${message}`);
      await this.log(
        request.task,
        this.provider.name,
        'unknown',
        false,
        Date.now() - started,
        message,
      );
      throw error;
    }
  }

  listLogs(limit = 50) {
    return this.prisma.aiRequestLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private offlineSummary(request: AiRequest): string {
    return [
      `# ${request.task.replaceAll('_', ' ')}`,
      '',
      '_OpenRouter is not configured. Offline template summary:_',
      '',
      '```json',
      JSON.stringify(request.context, null, 2),
      '```',
    ].join('\n');
  }

  private async log(
    task: string,
    provider: string,
    model: string,
    success: boolean,
    durationMs: number,
    error?: string,
  ) {
    await this.prisma.aiRequestLog.create({
      data: { task, provider, model, success, durationMs, error },
    });
  }
}
