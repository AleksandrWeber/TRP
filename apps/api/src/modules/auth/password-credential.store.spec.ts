import { describe, expect, it } from 'vitest';
import { InMemoryPasswordCredentialRepository } from './in-memory-password-credential.repository';
import { PasswordCredentialStore } from './password-credential.store';

describe('PasswordCredentialStore (PC-18)', () => {
  it('stores and verifies a password', async () => {
    const store = new PasswordCredentialStore(new InMemoryPasswordCredentialRepository());

    await store.setPassword('user-1', 'password-123');

    expect(store.has('user-1')).toBe(true);
    expect(await store.verify('user-1', 'password-123')).toBe(true);
    expect(await store.verify('user-1', 'wrong-password')).toBe(false);
    expect(await store.verify('missing', 'password-123')).toBe(false);
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
