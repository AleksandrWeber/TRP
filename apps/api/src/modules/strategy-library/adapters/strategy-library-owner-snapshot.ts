/**
 * W3-O01-b — Combined Strategy Library owner snapshot sections.
 * Read + certification adapters share one AnalyticalOwnerStoreSnapshot row.
 */

import type { StrategyLibraryCertificationDurableState } from './in-memory-strategy-library-certification.adapter';
import type { StrategyLibraryReadDurableState } from './in-memory-strategy-library-read.adapter';

export type StrategyLibraryOwnerSnapshot = Readonly<{
  read?: StrategyLibraryReadDurableState | null;
  certification?: StrategyLibraryCertificationDurableState | null;
}>;

export function asStrategyLibraryOwnerSnapshot(payload: unknown): StrategyLibraryOwnerSnapshot {
  if (payload === null || payload === undefined) {
    return Object.freeze({});
  }
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Strategy Library owner snapshot must be a plain object');
  }
  return payload as StrategyLibraryOwnerSnapshot;
}
