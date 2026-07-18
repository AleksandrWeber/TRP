import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearAccessToken,
  clearActiveWorkspace,
  getAccessToken,
  getActiveWorkspace,
  setAccessToken,
  setActiveWorkspace,
} from './auth';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('auth storage (US002)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores and reads the active workspace', () => {
    setActiveWorkspace({ id: 'ws-1', name: 'Default Workspace' });

    expect(getActiveWorkspace()).toEqual({ id: 'ws-1', name: 'Default Workspace' });
  });

  it('clearAccessToken also clears the active workspace', () => {
    setAccessToken('token');
    setActiveWorkspace({ id: 'ws-1', name: 'Default Workspace' });

    clearAccessToken();

    expect(getAccessToken()).toBeNull();
    expect(getActiveWorkspace()).toBeNull();
  });

  it('clearActiveWorkspace leaves the token intact', () => {
    setAccessToken('token');
    setActiveWorkspace({ id: 'ws-1', name: 'Default Workspace' });

    clearActiveWorkspace();

    expect(getAccessToken()).toBe('token');
    expect(getActiveWorkspace()).toBeNull();
  });
});
