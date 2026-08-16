import { describe, expect, it } from 'vitest';
import { InMemoryPasswordCredentialRepository } from './in-memory-password-credential.repository';
import { PasswordCredentialStore } from './password-credential.store';

describe('PasswordCredentialStore (PC-18)', () => {
  it('stores and verifies a password', async () => {
    const repository = new InMemoryPasswordCredentialRepository();
    const store = new PasswordCredentialStore(repository);

    await store.setPassword('user-1', 'password-123');

    expect(store.has('user-1')).toBe(true);
    expect(await store.verify('user-1', 'password-123')).toBe(true);
    expect(await store.verify('user-1', 'wrong-password')).toBe(false);
    expect(await store.verify('missing', 'password-123')).toBe(false);
    expect(await store.verifyAgainstStoredOrDummy('missing', 'password-123')).toBe(false);
    expect(await store.verifyAgainstStoredOrDummy(undefined, 'password-123')).toBe(false);
    expect(await store.verifyAgainstStoredOrDummy('user-1', 'password-123')).toBe(true);
    const stored = await repository.findByUserId('user-1');
    expect(stored).not.toBe('password-123');
    expect(stored?.startsWith('$2')).toBe(true);
  });

  it('hydrates hashes from the repository after a simulated restart', async () => {
    const repository = new InMemoryPasswordCredentialRepository();
    const original = new PasswordCredentialStore(repository);
    await original.setPassword('user-1', 'password-123');

    const restarted = new PasswordCredentialStore(repository);
    await restarted.onModuleInit();

    expect(restarted.has('user-1')).toBe(true);
    expect(await restarted.verify('user-1', 'password-123')).toBe(true);
  });
});
