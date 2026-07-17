import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignImportService } from './campaign-import.service';
import { ImportFormat } from './import-format';
import { ImportValidationError } from './import-validation.error';

export type CampaignImportRequestBody = {
  format?: string;
  payload?: unknown;
};

/**
 * HTTP import of Campaign Sessions (US065).
 * Does not persist — returns validated CampaignSession only.
 */
@Controller('campaign-import')
export class CampaignImportController {
  constructor(private readonly campaignImport: CampaignImportService) {}

  @Post()
  import(@Body() body: CampaignImportRequestBody): CampaignSession {
    const format = parseImportFormat(body?.format);
    const payload = requirePayloadString(body?.payload);

    try {
      return this.campaignImport.import(payload, format);
    } catch (error) {
      if (error instanceof ImportValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}

function parseImportFormat(formatRaw: string | undefined): ImportFormat {
  if (formatRaw === undefined || formatRaw.trim() === '') {
    throw new BadRequestException('format is required');
  }

  const normalized = formatRaw.trim().toLowerCase();
  if (normalized === 'json') return ImportFormat.JSON;

  throw new BadRequestException(`Unsupported import format: ${formatRaw}`);
}

function requirePayloadString(payload: unknown): string {
  if (typeof payload !== 'string' || payload.trim() === '') {
    throw new BadRequestException('payload must be a non-empty string');
  }
  return payload;
}
