import { describe, expect, it } from 'vitest';
import {
  VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION,
  buildVenuePermissionVerificationAnchorState,
} from './durable-venue-permission-verification-state';

const recordedAt = '2026-08-29T10:00:00.000Z';

describe('durable-venue-permission-verification-state — W4-E05-b', () => {
  it('buildVenuePermissionVerificationAnchorState stores canonical anchors only', () => {
    const outcome = buildVenuePermissionVerificationAnchorState({
      workspaceId: 'ws-perm',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-1',
      adapterExchangeConnectionId: 'ex-conn-1',
      permissionVerificationId: 'pv-1',
      vendorPermissionHash: 'hash-vendor',
      integrityMetadataHash: 'hash-integrity',
      correlationId: 'corr-1',
      recordedAt,
      prior: null,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.state).toMatchObject({
      workspaceId: 'ws-perm',
      schemaVersion: VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION,
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-1',
      adapterExchangeConnectionId: 'ex-conn-1',
      permissionVerificationId: 'pv-1',
      vendorPermissionHash: 'hash-vendor',
      integrityMetadataHash: 'hash-integrity',
      correlationId: 'corr-1',
    });
    expect(outcome.state).not.toHaveProperty('apiPermissions');
  });

  it('rejects workspace mismatch', () => {
    const priorOutcome = buildVenuePermissionVerificationAnchorState({
      workspaceId: 'ws-a',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-1',
      adapterExchangeConnectionId: 'ex-conn-1',
      permissionVerificationId: 'pv-1',
      vendorPermissionHash: 'hash-vendor',
      integrityMetadataHash: 'hash-integrity',
      correlationId: 'corr-1',
      recordedAt,
      prior: null,
    });
    expect(priorOutcome.ok).toBe(true);
    if (!priorOutcome.ok) {
      return;
    }

    const outcome = buildVenuePermissionVerificationAnchorState({
      workspaceId: 'ws-b',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-2',
      adapterExchangeConnectionId: 'ex-conn-2',
      permissionVerificationId: 'pv-2',
      vendorPermissionHash: 'hash-vendor-2',
      integrityMetadataHash: 'hash-integrity-2',
      correlationId: 'corr-2',
      recordedAt,
      prior: priorOutcome.state,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.reason).toBe('workspace_mismatch');
  });

  it('rejects exchange identifier mismatch', () => {
    const priorOutcome = buildVenuePermissionVerificationAnchorState({
      workspaceId: 'ws-a',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-1',
      adapterExchangeConnectionId: 'ex-conn-1',
      permissionVerificationId: 'pv-1',
      vendorPermissionHash: 'hash-vendor',
      integrityMetadataHash: 'hash-integrity',
      correlationId: 'corr-1',
      recordedAt,
      prior: null,
    });
    expect(priorOutcome.ok).toBe(true);
    if (!priorOutcome.ok) {
      return;
    }

    const outcome = buildVenuePermissionVerificationAnchorState({
      workspaceId: 'ws-a',
      exchangeIdentifier: 'BYBIT',
      connectionId: 'conn-2',
      adapterExchangeConnectionId: 'ex-conn-2',
      permissionVerificationId: 'pv-2',
      vendorPermissionHash: 'hash-vendor-2',
      integrityMetadataHash: 'hash-integrity-2',
      correlationId: 'corr-2',
      recordedAt,
      prior: priorOutcome.state,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.reason).toBe('exchange_identifier_mismatch');
  });
});
