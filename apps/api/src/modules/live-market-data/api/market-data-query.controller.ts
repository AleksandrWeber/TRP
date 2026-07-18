import { Controller, Get, Headers, NotFoundException, Param } from '@nestjs/common';
import { requireWorkspaceId } from '../../../common/workspace/require-workspace';
import { IdParamDto } from '../../../validation';
import { WorkspaceDomainService } from '../../workspace';
import { MarketDataQueryService } from './market-data-query.service';
import type {
  MarketCheckpointView,
  MarketLatestStateView,
  MarketStreamDetailView,
  MarketStreamStatusView,
  MarketSubscriptionView,
} from './market-data-views';

/**
 * Read-only live market-data query API (US146).
 * Authentication via global JWT guard; workspace isolation via X-Workspace-Id.
 * Cannot create Orders, Sessions, or strategy evaluations.
 */
@Controller({ path: 'market-data', version: '1' })
export class MarketDataQueryController {
  constructor(
    private readonly queries: MarketDataQueryService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get('subscriptions')
  listSubscriptions(
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): ReadonlyArray<MarketSubscriptionView> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.queries.listSubscriptions(workspaceId);
  }

  @Get('subscriptions/:id')
  getSubscription(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): MarketSubscriptionView {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const row = this.queries.getSubscription(workspaceId, params.id);
    if (!row) {
      throw new NotFoundException(`subscription ${params.id} not found`);
    }
    return row;
  }

  @Get('streams/status')
  listStatuses(
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): ReadonlyArray<MarketStreamStatusView> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.queries.listStatuses(workspaceId);
  }

  @Get('streams/latest')
  listLatest(
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): ReadonlyArray<MarketLatestStateView> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.queries.listLatest(workspaceId);
  }

  @Get('streams/:streamId/status')
  getStatus(
    @Param('streamId') streamId: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): MarketStreamStatusView {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const row = this.queries.getStatus(workspaceId, streamId);
    if (!row) {
      throw new NotFoundException(`stream status ${streamId} not found`);
    }
    return row;
  }

  @Get('streams/:streamId/latest')
  getLatest(
    @Param('streamId') streamId: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): MarketLatestStateView {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const row = this.queries.getLatest(workspaceId, streamId);
    if (!row) {
      throw new NotFoundException(`latest state ${streamId} not found`);
    }
    return row;
  }

  @Get('streams/:streamId/checkpoint')
  async getCheckpoint(
    @Param('streamId') streamId: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<MarketCheckpointView> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const row = await this.queries.getCheckpoint(workspaceId, streamId);
    if (!row) {
      throw new NotFoundException(`checkpoint ${streamId} not found`);
    }
    return row;
  }

  @Get('streams/:streamId')
  async getStreamDetail(
    @Param('streamId') streamId: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<MarketStreamDetailView> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const row = await this.queries.getStreamDetail(workspaceId, streamId);
    if (!row) {
      throw new NotFoundException(`stream ${streamId} not found`);
    }
    return row;
  }
}
