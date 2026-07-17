import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { parseApiPageRequest, toHistoryPage } from '../../common/api-list/api-list';
import type { HistoryPage } from '../campaign-persistence/history-page';
import type { ResearchReport } from './research-report';
import { ResearchReportDomainService } from './research-report-domain.service';

const SORT_BY = ['createdAt'] as const;

/**
 * Read-only Research Report REST adapter (US100).
 * Does not build reports — Domain Service search / getById only.
 */
@Controller('reports')
export class ResearchReportController {
  constructor(private readonly reports: ResearchReportDomainService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('campaignSessionId') campaignSessionId?: string,
  ): HistoryPage<ResearchReport> {
    const pageRequest = parseApiPageRequest(
      { page, pageSize, sortBy, sortOrder },
      {
        allowedSortBy: SORT_BY,
        defaultSortBy: 'createdAt',
        badRequest: (message) => new BadRequestException(message),
      },
    );

    const filters = {
      ...(campaignSessionId !== undefined && campaignSessionId !== '' ? { campaignSessionId } : {}),
    };

    const items = this.reports.search(filters);
    return toHistoryPage(items, pageRequest, (report, _field) => report.createdAt);
  }

  @Get(':id')
  getById(@Param('id') id: string): ResearchReport {
    const report = this.reports.getById(id);
    if (!report) {
      throw new NotFoundException(`Research report ${id} not found`);
    }
    return report;
  }
}
