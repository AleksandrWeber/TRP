/**
 * RC-25 Epic 3 — StructuralCharacteristics (Market Structure Profile).
 *
 * Domain Model Contract §10.4.
 * Canonical name: StructuralCharacteristics (task alias: Market Structure Profile).
 */

import {
  assertNonEmptyString,
  deepFreeze,
  isMarketProfileForbiddenMetricKey,
  isStructuralCharacteristicKey,
  type StructuralCharacteristicKey,
} from './market-profile-domain-shared';

export type StructuralCharacteristicEntry = Readonly<{
  key: StructuralCharacteristicKey;
  value: string;
}>;

export type StructuralCharacteristics = Readonly<{
  characteristics: readonly StructuralCharacteristicEntry[];
  notes?: string;
}>;

export type CreateStructuralCharacteristicsInput = Readonly<{
  characteristics: readonly Readonly<{ key: string; value: string }>[];
  notes?: string;
}>;

export function createStructuralCharacteristics(
  input: CreateStructuralCharacteristicsInput,
): StructuralCharacteristics {
  if (!input.characteristics || input.characteristics.length === 0) {
    throw new Error('characteristics must be non-empty');
  }

  const characteristics = input.characteristics.map((entry) => {
    const keyRaw = assertNonEmptyString(entry.key, 'characteristics.key');
    if (isMarketProfileForbiddenMetricKey(keyRaw)) {
      throw new Error(`forbidden structural key: ${keyRaw}`);
    }
    if (!isStructuralCharacteristicKey(keyRaw)) {
      throw new Error(`unknown structural characteristic key: ${keyRaw}`);
    }
    const value = assertNonEmptyString(entry.value, 'characteristics.value');
    return Object.freeze({ key: keyRaw, value });
  });

  const notes =
    input.notes !== undefined && input.notes.trim() !== '' ? input.notes.trim() : undefined;

  return deepFreeze({
    characteristics: Object.freeze(characteristics),
    ...(notes !== undefined ? { notes } : {}),
  });
}
