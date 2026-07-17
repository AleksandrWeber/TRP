import { Injectable } from '@nestjs/common';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignImporter } from './campaign-importer';
import { CampaignSessionValidator } from './campaign-session.validator';
import { ImportFormat } from './import-format';
import { ImportValidationError } from './import-validation.error';

/**
 * Parses JSON then validates into a CampaignSession (US063–US064).
 * Flow: parse → CampaignSessionValidator → CampaignSession.
 */
@Injectable()
export class JsonCampaignImporter implements CampaignImporter {
  readonly format = ImportFormat.JSON;

  constructor(private readonly validator: CampaignSessionValidator) {}

  import(payload: string): CampaignSession {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new ImportValidationError('Invalid JSON payload', 'payload');
    }

    return this.validator.validate(parsed);
  }
}
