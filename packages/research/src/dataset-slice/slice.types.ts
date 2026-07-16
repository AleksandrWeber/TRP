export const SLICE_ROLES = ['FULL', 'TRAIN', 'TEST', 'HOLD_OUT', 'VALIDATION'] as const;

export type SliceRole = (typeof SLICE_ROLES)[number];

/**
 * Canonical slice identity: datasetId + startIndex + endIndex + role.
 * No separate opaque sliceId (ADR-011).
 */
export type SliceIdentity = string;

/**
 * Immutable reference to a bar range on an existing dataset.
 * Construct only via SliceResolver (ADR-011).
 */
export type SliceRef = Readonly<{
  datasetId: string;
  startIndex: number;
  endIndex: number;
  role: SliceRole;
}>;

export type CreateSliceRefInput = {
  datasetId: string;
  startIndex: number;
  endIndex: number;
  role: SliceRole;
  /** Bar count used to validate inclusive bounds. */
  datasetLength: number;
};

export type ResolvedSlice<TBar> = {
  ref: SliceRef;
  sliceIdentity: SliceIdentity;
  bars: TBar[];
};
