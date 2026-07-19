import { Body, Controller, Headers, NotFoundException, Post } from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { EvaluateSignalBodyDto } from '../../validation';
import { WorkspaceDomainService } from '../workspace';
import type { SignalResult } from './domain/signal-result';
import { SignalEngineService } from './signal-engine.service';

/**
 * Signal Engine HTTP API (US009).
 * POST /v1/market/signal/evaluate — evaluate one strategy on request and
 * return the SignalResult. Workspace-scoped via `X-Workspace-Id` (strategies
 * are workspace-owned, US004): a strategy of another workspace is a 404,
 * never a leak. No persistence, no scheduling.
 */
@Controller({ path: 'market/signal', version: '1' })
export class SignalEngineController {
  constructor(
    private readonly engine: SignalEngineService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Post('evaluate')
  async evaluate(
    @Body() body: EvaluateSignalBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<SignalResult> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const result = await this.engine.evaluate(workspaceId, body.strategyId);
    if (!result) throw new NotFoundException('Strategy not found');
    return result;
  }
}
