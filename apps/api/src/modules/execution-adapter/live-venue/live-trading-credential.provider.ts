/**
 * V3-L02-S-ADP1 — Trusted credential resolution for live venue adapters.
 * ENV1 gates retrieve; raw secrets never logged.
 */

import type { HoldableSecretType } from '../../secret-vault/holdable-secret-type';
import type { SecretFieldMap } from '../../secret-vault/secret-material';
import type { SecretPurpose } from '../../secret-vault/secret-purpose';
import {
  assertMayRetrieveTradingCredential,
  redactCredentialMaterial,
} from '../live-venue-egress/live-credential-environment-policy';

export const LIVE_TRADING_CREDENTIAL_PROVIDER = Symbol('LIVE_TRADING_CREDENTIAL_PROVIDER');

export type LiveTradingCredentialRecord = Readonly<{
  workspaceId: string;
  type: HoldableSecretType;
  purpose: SecretPurpose;
  fields: SecretFieldMap;
}>;

export type LiveTradingCredentialProvider = {
  /**
   * Resolve trading credentials for workspace+type+purpose.
   * Implementations MUST NOT log field values.
   */
  resolve(input: {
    workspaceId: string;
    type: HoldableSecretType;
    purpose: SecretPurpose;
    executionMode: 'live' | 'paper' | 'mock';
  }): Promise<LiveTradingCredentialRecord | null>;
};

/** In-memory synthetic credentials for ADP1 tests — never production. */
export class InMemoryLiveTradingCredentialProvider implements LiveTradingCredentialProvider {
  private readonly records = new Map<string, LiveTradingCredentialRecord>();

  seed(record: LiveTradingCredentialRecord): void {
    this.records.set(slotKey(record.workspaceId, record.type, record.purpose), record);
  }

  async resolve(input: {
    workspaceId: string;
    type: HoldableSecretType;
    purpose: SecretPurpose;
    executionMode: 'live' | 'paper' | 'mock';
  }): Promise<LiveTradingCredentialRecord | null> {
    const may = assertMayRetrieveTradingCredential({
      executionMode: input.executionMode,
      purpose: input.purpose,
    });
    if (!may.ok) {
      return null;
    }
    return this.records.get(slotKey(input.workspaceId, input.type, input.purpose)) ?? null;
  }
}

export function safeCredentialErrorMessage(reason: string, detail?: string): string {
  const raw = detail ? `${reason}:${detail}` : reason;
  return redactCredentialMaterial(raw).slice(0, 200);
}

function slotKey(workspaceId: string, type: string, purpose: string): string {
  return `${workspaceId}::${type}::${purpose}`;
}
