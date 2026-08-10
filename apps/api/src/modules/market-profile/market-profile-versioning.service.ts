/**
 * RC-25 Epic 5 — Market Profile version publish service.
 *
 * Registers immutable MarketProfile versions from caller-supplied payloads.
 * Does NOT calculate volatility / liquidity / trend / structure.
 * Does NOT score markets, authorize trading, or select strategies.
 */

import { Inject, Injectable } from '@nestjs/common';
import { deriveQualificationTargetId } from '../market-qualification';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  type MarketQualificationQueryPort,
} from '../market-qualification/ports/market-qualification.port';
import { InMemoryMarketProfileStore } from './adapters/in-memory-market-profile-store';
import { createMarketProfile } from './domain/market-profile';
import type {
  MarketProfileServicePort,
  PublishMarketProfile,
  PublishProfileResult,
} from './ports/market-profile.port';
import { deriveMarketProfileId } from './versioning/derive-market-profile-ids';

const DEFAULT_TS = '1970-01-01T00:00:00.000Z';

@Injectable()
export class MarketProfileVersioningService implements MarketProfileServicePort {
  constructor(
    @Inject(InMemoryMarketProfileStore)
    private readonly store: InMemoryMarketProfileStore,
    @Inject(MARKET_QUALIFICATION_QUERY_PORT)
    private readonly qualificationQuery: MarketQualificationQueryPort,
  ) {}

  publishProfileVersion(cmd: PublishMarketProfile): PublishProfileResult {
    if (!cmd.workspaceId?.trim()) {
      return rejected('', 0, ['workspace_required']);
    }
    if (!cmd.exchangeScopeId?.trim() || !cmd.marketSymbol?.trim()) {
      return rejected('', 0, ['target_required']);
    }
    if (!cmd.qualificationRunId?.trim()) {
      return rejected('', 0, ['qualification_run_required']);
    }
    if (!cmd.publishedBy?.trim()) {
      return rejected('', 0, ['published_by_required']);
    }
    if (!cmd.volatility || !cmd.liquidity || !cmd.trend || !cmd.structure) {
      return rejected('', 0, ['dimensions_required']);
    }
    if (!cmd.confidenceSummary) {
      return rejected('', 0, ['confidence_summary_required']);
    }

    const run = this.qualificationQuery.getQualificationRun({
      workspaceId: cmd.workspaceId,
      qualificationRunId: cmd.qualificationRunId,
    });
    if (!run) {
      return rejected('', 0, ['qualification_run_not_found']);
    }
    if (run.status !== 'completed') {
      return rejected('', 0, [`qualification_run_not_completed:${run.status}`]);
    }

    const targetId = deriveQualificationTargetId(
      cmd.workspaceId,
      cmd.exchangeScopeId,
      cmd.marketSymbol,
    );
    if (run.targetId !== targetId) {
      return rejected('', 0, ['qualification_run_target_mismatch']);
    }

    const version = this.store.nextVersion(targetId);
    const publishedAt = cmd.publishedAt?.trim() || DEFAULT_TS;
    const marketProfileId = cmd.marketProfileId?.trim() || deriveMarketProfileId(targetId, version);

    if (this.store.getById(marketProfileId)) {
      return rejected(marketProfileId, version, ['profile_id_exists']);
    }
    if (this.store.getByVersion(targetId, version)) {
      return rejected(marketProfileId, version, ['profile_version_exists']);
    }

    let profile;
    try {
      profile = createMarketProfile({
        marketProfileId,
        workspaceId: cmd.workspaceId,
        targetId,
        exchangeScopeId: cmd.exchangeScopeId,
        marketSymbol: cmd.marketSymbol,
        version,
        qualificationRunId: cmd.qualificationRunId,
        volatility: cmd.volatility,
        liquidity: cmd.liquidity,
        trend: cmd.trend,
        structure: cmd.structure,
        confidenceSummary: cmd.confidenceSummary,
        publishedAt,
        publishedBy: cmd.publishedBy,
      });
    } catch (error) {
      return rejected(marketProfileId, version, [
        error instanceof Error ? error.message : 'invalid_profile',
      ]);
    }

    try {
      this.store.putProfile(profile);
    } catch (error) {
      return rejected(marketProfileId, version, [
        error instanceof Error ? error.message : 'store_reject',
      ]);
    }

    return {
      outcome: 'published',
      marketProfileId: profile.marketProfileId,
      version: profile.version,
      marketProfile: profile,
      forcesTrade: false,
      authorizesSession: false,
    };
  }
}

function rejected(
  marketProfileId: string,
  version: number,
  rejectionReasons: readonly string[],
): PublishProfileResult {
  return {
    outcome: 'rejected',
    marketProfileId,
    version,
    rejectionReasons,
    forcesTrade: false,
    authorizesSession: false,
  };
}
