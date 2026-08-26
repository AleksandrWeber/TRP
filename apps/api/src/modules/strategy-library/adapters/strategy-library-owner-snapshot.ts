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
  if (!payload || typeof payload !== 'object') {
    return Object.freeze({});
  }
  return payload as StrategyLibraryOwnerSnapshot;
}
