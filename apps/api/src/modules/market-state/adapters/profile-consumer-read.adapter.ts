/**
 * RC-26 Epic 2 — Market Profile consumer read adapter (Market State).
 *
 * Wraps RC-25 MarketProfileConsumerReadPort → Market State input models.
 * No ownership transfer. No classification. Empty-safe (null / empty arrays).
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  MARKET_PROFILE_CONSUMER_READ_PORT,
  type MarketProfileConsumerReadPort,
} from '../../market-profile/ports/market-profile-consumer.port';
import {
  toProfileLatestInput,
  toProfileVersionMetadataInput,
  toProfileVersionMetadataInputs,
  type MarketStateProfileVersionReadQuery,
  type MarketStateTargetReadQuery,
  type ProfileLatestInput,
  type ProfileVersionMetadataInput,
} from '../domain/market-state-input-read-model';
import type { MarketStateProfileConsumerPort } from '../ports/market-state.port';

@Injectable()
export class MarketStateProfileReadAdapter implements MarketStateProfileConsumerPort {
  constructor(
    @Inject(MARKET_PROFILE_CONSUMER_READ_PORT)
    private readonly profileConsumer: MarketProfileConsumerReadPort,
  ) {}

  getLatestProfile(query: MarketStateTargetReadQuery): ProfileLatestInput | null {
    if (!query.workspaceId || !query.exchangeScopeId || !query.marketSymbol) {
      return null;
    }
    return toProfileLatestInput(this.profileConsumer.getLatestProfileProjection(query));
  }

  getProfileHistory(query: MarketStateTargetReadQuery): readonly ProfileVersionMetadataInput[] {
    if (!query.workspaceId || !query.exchangeScopeId || !query.marketSymbol) {
      return Object.freeze([]);
    }
    return toProfileVersionMetadataInputs(this.profileConsumer.getProfileHistory(query));
  }

  getProfileVersionMetadata(
    query: MarketStateProfileVersionReadQuery,
  ): ProfileVersionMetadataInput | null {
    if (!query.workspaceId || !query.exchangeScopeId || !query.marketSymbol) {
      return null;
    }
    return toProfileVersionMetadataInput(this.profileConsumer.getProfileVersionMetadata(query));
  }
}
