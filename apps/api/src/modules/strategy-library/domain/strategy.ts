/**
 * RC-22 Epic 2 — Strategy (family) domain entity.
 *
 * Logical trading strategy family in the Strategy Library.
 * The family is not itself certified — versions are the production-facing units.
 *
 * Distinct from the experimental registry `strategies` module entity.
 * No certification / eligibility / envelope / lifecycle workflow in Epic 2.
 */

import { assertIsoTimestamp, strategyFamilyId, type StrategyFamilyId } from './value-objects';

export type Strategy = Readonly<{
  strategyFamilyId: StrategyFamilyId;
  name: string;
  description: string | null;
  /** Optional pointer to experimental registry strategy id (not certification). */
  registryRef: string | null;
  workspaceId: string;
  createdAt: string;
}>;

export type CreateStrategyInput = Readonly<{
  strategyFamilyId: string;
  name: string;
  description?: string | null;
  registryRef?: string | null;
  workspaceId: string;
  createdAt: string;
}>;

/**
 * Create an immutable Strategy family.
 * Does not create versions and does not certify.
 */
export function createStrategy(input: CreateStrategyInput): Strategy {
  const familyId = strategyFamilyId(input.strategyFamilyId);
  const name = input.name.trim();
  if (!name) {
    throw new Error('name is required');
  }
  const workspaceId = input.workspaceId.trim();
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  const description =
    input.description === undefined || input.description === null || input.description.trim() === ''
      ? null
      : input.description.trim();
  const registryRef =
    input.registryRef === undefined || input.registryRef === null || input.registryRef.trim() === ''
      ? null
      : input.registryRef.trim();

  return Object.freeze({
    strategyFamilyId: familyId,
    name,
    description,
    registryRef,
    workspaceId,
    createdAt: assertIsoTimestamp(input.createdAt, 'createdAt'),
  });
}

/** Epic 2: Strategy has no certification state. */
export function strategyHasCertificationState(_strategy: Strategy): false {
  void _strategy;
  return false;
}
