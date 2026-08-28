import { describe, expect, it } from 'vitest';
import {
  VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION,
  buildVenuePermissionVerificationAnchorState,
} from './durable-venue-permission-verification-state';
import {
  VenuePermissionRestartRecoveryError,
  prepareVenuePermissionVerificationStatesForRecovery,
  sortVenuePermissionVerificationStatesDeterministically,
} from './venue-permission-restart-recovery';

const recordedAt = '2026-08-29T10:00:00.000Z';

function verifiedAnchor(workspaceId: string, exchangeIdentifier: string) {
  const outcome = buildVenuePermissionVerificationAnchorState({
    workspaceId,
    exchangeIdentifier,
    connectionId: 'conn-42',
    adapterExchangeConnectionId: 'ex-conn-9',
    permissionVerificationId: 'pv-99',
    vendorPermissionHash: 'vendor-hash',
    integrityMetadataHash: 'integrity-hash',
    correlationId: 'corr-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected verified anchor');
  return outcome.state;
}

describe('venue-permission-restart-recovery domain — W4-E05-c', () => {
  it('sortVenuePermissionVerificationStatesDeterministically orders by workspaceId ascending', () => {
    const wsB = verifiedAnchor('ws-b', 'BINANCE');
    const wsA = verifiedAnchor('ws-a', 'BINANCE');
    const ordered = sortVenuePermissionVerificationStatesDeterministically([wsB, wsA]);
    expect(ordered.map((s) => s.workspaceId)).toEqual(['ws-a', 'ws-b']);
  });

  it('sortVenuePermissionVerificationStatesDeterministically orders by exchangeIdentifier within workspace', () => {
    const okx = verifiedAnchor('ws-1', 'OKX');
    const binance = verifiedAnchor('ws-1', 'BINANCE');
    const ordered = sortVenuePermissionVerificationStatesDeterministically([okx, binance]);
    expect(ordered.map((s) => s.exchangeIdentifier)).toEqual(['BINANCE', 'OKX']);
  });

  it('prepareVenuePermissionVerificationStatesForRecovery rejects missing integrityMetadataHash', () => {
    const bad = Object.freeze({
      ...verifiedAnchor('ws-1', 'BINANCE'),
      integrityMetadataHash: null,
    });
    expect(() => prepareVenuePermissionVerificationStatesForRecovery([bad])).toThrow(
      VenuePermissionRestartRecoveryError,
    );
  });

  it('prepareVenuePermissionVerificationStatesForRecovery rejects duplicate workspace+exchange row', () => {
    const state = verifiedAnchor('ws-1', 'BINANCE');
    expect(() => prepareVenuePermissionVerificationStatesForRecovery([state, state])).toThrow(
      VenuePermissionRestartRecoveryError,
    );
  });

  it('prepareVenuePermissionVerificationStatesForRecovery rejects unsupported schema version', () => {
    const bad = Object.freeze({
      ...verifiedAnchor('ws-1', 'BINANCE'),
      schemaVersion: VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION + 1,
    });
    expect(() => prepareVenuePermissionVerificationStatesForRecovery([bad])).toThrow(
      VenuePermissionRestartRecoveryError,
    );
  });

  it('prepareVenuePermissionVerificationStatesForRecovery returns empty for empty input', () => {
    expect(prepareVenuePermissionVerificationStatesForRecovery([])).toEqual([]);
  });
});
