import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { parseApiPageRequest, toHistoryPage } from '../../common/api-list/api-list';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { IdParamDto, ListResearchReportQueryDto } from '../../validation';
import type { HistoryPage } from '../campaign-persistence/history-page';
import { WorkspaceDomainService } from '../workspace';
import type { ResearchReport } from './research-report';
import { ResearchReportDomainService } from './research-report-domain.service';

const SORT_BY = ['createdAt'] as const;

/**
 * Read-only Research Report REST adapter (US100).
 * Does not build reports — Domain Service search / getById only.
 * Scoped by X-Workspace-Id (US109).
 */
@Controller({ path: 'reports', version: '1' })
export class ResearchReportController {
  constructor(
    private readonly reports: ResearchReportDomainService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  list(
    @Query() query: ListResearchReportQueryDto = {},
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): HistoryPage<ResearchReport> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const pageRequest = parseApiPageRequest(query, {
      allowedSortBy: SORT_BY,
      defaultSortBy: 'createdAt',
      badRequest: (message) => new BadRequestException(message),
    });

    const { campaignSessionId } = query;
    const filters = {
      ...(campaignSessionId !== undefined && campaignSessionId !== '' ? { campaignSessionId } : {}),
    };

    const items = this.reports.search(filters, workspaceId);
    return toHistoryPage(items, pageRequest, (report, _field) => report.createdAt);
  }

  @Get(':id')
  getById(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): ResearchReport {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const report = this.reports.getById(params.id, workspaceId);
    if (!report) {
      throw new NotFoundException(`Research report ${params.id} not found`);
    }
    return report;
  }
}
