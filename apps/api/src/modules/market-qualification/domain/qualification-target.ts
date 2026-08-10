/**
 * RC-25 Epic 3 — QualificationTarget (venue/market identity).
 *
 * Domain Model Contract §4.
 * Identity only — does not authorize trading or imply Session eligibility.
 */

import {
  MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
} from './market-qualification-domain-shared';

export type QualificationTarget = Readonly<{
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName?: string;
  createdAt: string;
  authorityClass: typeof MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS;
}>;

export type CreateQualificationTargetInput = Readonly<{
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName?: string;
  createdAt: string;
}>;

/**
 * Create an immutable QualificationTarget.
 * Does not authorize trading. Does not start Sessions.
 */
export function createQualificationTarget(
  input: CreateQualificationTargetInput,
): QualificationTarget {
  const targetId = assertNonEmptyString(input.targetId, 'targetId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const exchangeScopeId = assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId');
  const marketSymbol = assertNonEmptyString(input.marketSymbol, 'marketSymbol');
  const createdAt = assertIsoTimestamp(input.createdAt, 'createdAt');

  const displayName =
    input.displayName !== undefined && input.displayName.trim() !== ''
      ? input.displayName.trim()
      : undefined;

  return deepFreeze({
    targetId,
    workspaceId,
    exchangeScopeId,
    marketSymbol,
    ...(displayName !== undefined ? { displayName } : {}),
    createdAt,
    authorityClass: MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  });
}
