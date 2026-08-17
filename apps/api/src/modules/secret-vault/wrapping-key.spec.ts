import { describe, expect, it } from 'vitest';
import {
  MIN_WRAPPING_KEY_LENGTH,
  envWrappingKeySource,
  parseVaultWrappingKey,
  requireWrappingKey,
  staticWrappingKeySource,
  wrappingKeyFromEnv,
} from './wrapping-key';
import { wrappingKeyUnsetMustFailApiBoot } from './vault-failure';
import { VaultUnavailableError } from './vault-errors';

describe('wrapping key (V3-S03-b)', () => {
  it('treats missing and short keys as unset without throwing', () => {
    expect(parseVaultWrappingKey(undefined)).toBeNull();
    expect(parseVaultWrappingKey('')).toBeNull();
    expect(parseVaultWrappingKey('   ')).toBeNull();
    expect(parseVaultWrappingKey('too-short')).toBeNull();
    expect(parseVaultWrappingKey('x'.repeat(MIN_WRAPPING_KEY_LENGTH - 1))).toBeNull();
    expect(wrappingKeyFromEnv({})).toBeNull();
    expect(envWrappingKeySource(() => undefined).resolve()).toBeNull();
    expect(wrappingKeyUnsetMustFailApiBoot()).toBe(false);
  });

  it('accepts a host wrapping key of sufficient length', () => {
    const key = parseVaultWrappingKey('trp-host-vault-wrapping-key-v3-s03b');
    expect(key).toBeInstanceOf(Buffer);
    expect(key?.length).toBeGreaterThanOrEqual(MIN_WRAPPING_KEY_LENGTH);
    expect(
      parseVaultWrappingKey('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
        ?.length,
    ).toBe(32);
  });

  it('fails closed when a wrapping key is required and missing', () => {
    expect(() => requireWrappingKey(staticWrappingKeySource(null))).toThrow(VaultUnavailableError);
  });
});
