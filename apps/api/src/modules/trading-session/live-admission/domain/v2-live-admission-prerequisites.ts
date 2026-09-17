/**
 * PROPOSED-V3-L01-S04 — V2 hard-stop readers (PO-S04 hard DENY).
 * Do not mutate V2_READINESS or compatibility matrix.
 */

import { V2_READINESS } from '../../../../platform-conformance/v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from '../../../../platform-conformance/v2-compatibility-matrix';

/** Production V2 snapshot — liveCapitalAuthorized is currently false. */
export function readLiveCapitalAuthorizedAnchor(): boolean {
  // Typed as literal false in V2_READINESS; read without inventing a true path.
  return Boolean(V2_READINESS.liveCapitalAuthorized);
}

/** True when Paper Freeze blocks live admission (current matrix: all rows true). */
export function readPaperFreezeBlocksLive(): boolean {
  return V2_COMPATIBILITY_MATRIX.every((row) => row.paperFreeze === true);
}

/**
 * Build injectable V2 snapshot for admission evaluation.
 * Tests may pass overrides without mutating production anchors.
 */
export function buildV2LiveAdmissionSnapshot(overrides?: {
  liveCapitalAuthorized?: boolean;
  paperFreezeBlocksLive?: boolean;
}): Readonly<{ liveCapitalAuthorized: boolean; paperFreezeBlocksLive: boolean }> {
  return Object.freeze({
    liveCapitalAuthorized: overrides?.liveCapitalAuthorized ?? readLiveCapitalAuthorizedAnchor(),
    paperFreezeBlocksLive: overrides?.paperFreezeBlocksLive ?? readPaperFreezeBlocksLive(),
  });
}
