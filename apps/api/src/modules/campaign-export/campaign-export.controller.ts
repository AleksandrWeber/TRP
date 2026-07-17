import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { CampaignHistoryService } from '../campaign-persistence/campaign-history.service';
import { CampaignExportService } from './campaign-export.service';
import { ExportFormat } from './export-format';

/**
 * Read-only HTTP export of Campaign Sessions (US062).
 * Flow: HistoryService.getById → CampaignExportService.export.
 */
@Controller('campaign-history')
export class CampaignExportController {
  constructor(
    private readonly history: CampaignHistoryService,
    private readonly campaignExport: CampaignExportService,
  ) {}

  @Get(':sessionId/export')
  export(
    @Param('sessionId') sessionId: string,
    @Query('format') formatRaw: string | undefined,
    @Res() reply: FastifyReply,
  ): void {
    const format = parseExportFormat(formatRaw);
    const session = this.history.getById(sessionId);
    if (!session) {
      throw new NotFoundException(`Campaign session ${sessionId} not found`);
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
