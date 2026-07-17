import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import type { Metrics } from '../../metrics/metrics';
import { MetricNames } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { PrismaService } from '../../storage/prisma/prisma.module';
import type { AiRequest, AiResponse } from './ai.types';
import { buildPrompt } from './prompts/templates';
import { OpenRouterProvider } from './providers/openrouter.provider';

@Injectable()
export class AiGatewayService {
  private readonly logger: Logger;

  constructor(
    @Inject(OpenRouterProvider) private readonly provider: OpenRouterProvider,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(LOGGER) logger: Logger,
    @Inject(METRICS) private readonly metrics: Metrics,
  ) {
    this.logger = logger.child(AiGatewayService.name);
  }

  async execute(request: AiRequest): Promise<AiResponse> {
    const started = Date.now();
    const { system, user } = buildPrompt(request.task, request.context);

    if (!this.provider.isConfigured()) {
      const content = this.offlineSummary(request);
      const durationMs = Date.now() - started;
      await this.log(request.task, 'offline', 'n/a', true, durationMs);
      this.recordMetrics('offline', true, durationMs);
      return { content, provider: 'offline', model: 'n/a' };
    }

    try {
      const result = await this.provider.complete(system, user);
      const durationMs = Date.now() - started;
      await this.log(request.task, this.provider.name, result.model, true, durationMs);
      this.recordMetrics(this.provider.name, true, durationMs);
      return {
        content: result.content,
        provider: this.provider.name,
        model: result.model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI request failed: ${message}`);
      const durationMs = Date.now() - started;
      await this.log(request.task, this.provider.name, 'unknown', false, durationMs, message);
      this.recordMetrics(this.provider.name, false, durationMs);
      throw error;
    }
  }

  private recordMetrics(provider: string, success: boolean, durationMs: number): void {
    const labels = { provider, success: success ? 'true' : 'false' };
    this.metrics.increment(MetricNames.aiRequestsTotal, 1, labels);
    this.metrics.timing(MetricNames.aiRequestDurationMs, durationMs, labels);
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
