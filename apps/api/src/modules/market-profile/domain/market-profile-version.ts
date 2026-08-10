/**
 * RC-25 Epic 5 — MarketProfileVersion alias + version identity helpers.
 *
 * Product alias (Domain Model Contract §9):
 * Profile Version ≡ one immutable MarketProfile row.
 */

import type { MarketProfile } from './market-profile';

/** Immutable profile version artifact (alias of MarketProfile). */
export type MarketProfileVersion = MarketProfile;

export type MarketProfileVersionRef = Readonly<{
  marketProfileId: string;
  targetId: string;
  version: number;
  publishedAt: string;
}>;

export function toMarketProfileVersionRef(profile: MarketProfileVersion): MarketProfileVersionRef {
  return Object.freeze({
    marketProfileId: profile.marketProfileId,
    targetId: profile.targetId,
    version: profile.version,
    publishedAt: profile.publishedAt,
  });
}
