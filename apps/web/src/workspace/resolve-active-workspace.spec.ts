import { describe, expect, it, vi } from 'vitest';
import { resolveActiveWorkspace } from './resolve-active-workspace';

describe('resolveActiveWorkspace (PC-14)', () => {
  it('keeps a stored active workspace instead of bootstrapping', async () => {
    const getWorkspace = vi.fn().mockResolvedValue({
      id: 'ws-2',
      name: 'Paper Lab',
      status: 'Active',
    });
    const bootstrap = vi.fn();

    const resolved = await resolveActiveWorkspace({
      stored: { id: 'ws-2', name: 'Paper Lab' },
      getWorkspace,
      bootstrap,
    });

    expect(resolved).toEqual({ id: 'ws-2', name: 'Paper Lab' });
    expect(bootstrap).not.toHaveBeenCalled();
  });

  it('bootstraps when the stored workspace is gone or archived', async () => {
    const getWorkspace = vi.fn().mockRejectedValue(new Error('Workspace not found.'));
    const bootstrap = vi.fn().mockResolvedValue({ id: 'ws-default', name: 'Default Workspace' });

    const resolved = await resolveActiveWorkspace({
      stored: { id: 'ws-gone', name: 'Old' },
      getWorkspace,
      bootstrap,
    });

    expect(resolved).toEqual({ id: 'ws-default', name: 'Default Workspace' });
    expect(bootstrap).toHaveBeenCalledOnce();
  });

  it('bootstraps when nothing is stored', async () => {
    const bootstrap = vi.fn().mockResolvedValue({ id: 'ws-1', name: 'Default Workspace' });

    const resolved = await resolveActiveWorkspace({
      stored: null,
      getWorkspace: vi.fn(),
      bootstrap,
    });

    expect(resolved.id).toBe('ws-1');
    expect(bootstrap).toHaveBeenCalledOnce();
  });

  it('rethrows network errors so the auth gate can keep a cached workspace', async () => {
    await expect(
      resolveActiveWorkspace({
        stored: { id: 'ws-1', name: 'Cached' },
        getWorkspace: vi.fn().mockRejectedValue(new Error('Cannot reach API')),
        bootstrap: vi.fn(),
      }),
    ).rejects.toThrow(/Cannot reach API/);
  });
});
