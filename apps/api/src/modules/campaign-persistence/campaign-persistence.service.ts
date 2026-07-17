import { Inject, Injectable } from '@nestjs/common';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignRepository } from './campaign-repository';
import { CAMPAIGN_REPOSITORY } from './campaign-repository.token';
import { CampaignSessionMapper } from './campaign-session.mapper';

/**
 * Public entry point to the Campaign Persistence layer.
 * Persists CampaignSession via CampaignRecord; never exposes CampaignRecord.
 */
@Injectable()
export class CampaignPersistenceService {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY) private readonly repository: CampaignRepository,
    private readonly mapper: CampaignSessionMapper,
  ) {}

  save(session: CampaignSession): void {
    const record = this.mapper.toRecord(session);
    this.repository.save(record);
  }

  findById(id: string, workspaceId: string): CampaignSession | null {
    const record = this.repository.findById(id, workspaceId);
    if (!record) return null;
    return this.mapper.toSession(record);
  }

  findAll(workspaceId: string): CampaignSession[] {
    return this.repository.findAll(workspaceId).map((record) => this.mapper.toSession(record));
  }

  exists(id: string, workspaceId: string): boolean {
    return this.repository.exists(id, workspaceId);
  }

  delete(id: string, workspaceId: string): void {
    this.repository.delete(id, workspaceId);
  }
}
