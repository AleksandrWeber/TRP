import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { ExportCampaignQueryDto, SessionIdParamDto } from '../../validation';
import { WorkspaceDomainService } from '../workspace';
import { CampaignHistoryService } from '../campaign-persistence/campaign-history.service';
import { CampaignExportService } from './campaign-export.service';
import { ExportFormat } from './export-format';

type ReplyLike = {
  status: (code: number) => ReplyLike;
  header: (name: string, value: string) => ReplyLike;
  send: (payload: unknown) => unknown;
};

/**
 * Read-only HTTP export of Campaign Sessions (US062).
 * Flow: HistoryService.getById → CampaignExportService.export.
 */
@Controller({ path: 'campaign-history', version: '1' })
export class CampaignExportController {
  constructor(
    private readonly history: CampaignHistoryService,
    private readonly campaignExport: CampaignExportService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get(':sessionId/export')
  export(
    @Param() params: SessionIdParamDto,
    @Query() query: ExportCampaignQueryDto,
    @Res() reply: ReplyLike,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): void {
    const format = parseExportFormat(query.format);
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const session = this.history.getById(params.sessionId, workspaceId);
    if (!session) {
      throw new NotFoundException(`Campaign session ${params.sessionId} not found`);
    }

    const content = this.campaignExport.export(session, format);
    const contentType = format === ExportFormat.CSV ? 'text/csv' : 'application/json';

    void reply.status(200).header('Content-Type', contentType).send(content);
  }
}

function parseExportFormat(formatRaw: string | undefined): ExportFormat {
  if (formatRaw === undefined || formatRaw.trim() === '') {
    throw new BadRequestException('format query parameter is required');
  }

  const normalized = formatRaw.trim().toLowerCase();
  if (normalized === 'json') return ExportFormat.JSON;
  if (normalized === 'csv') return ExportFormat.CSV;

  throw new BadRequestException(`Unsupported export format: ${formatRaw}`);
}
