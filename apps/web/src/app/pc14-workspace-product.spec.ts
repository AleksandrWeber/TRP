import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-14 Workspace product path', () => {
  it('Operator Shell hosts the workspace switcher', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    expect(layout).toContain('WorkspaceSwitcher');
    expect(layout).not.toContain('Coming Soon');
  });

  it('REST client exposes list, create, get, rename, and archive over the existing workspace owner', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain("request<WorkspaceView[]>('/workspaces')");
    expect(api).toContain("request<WorkspaceView>('/workspaces'");
    expect(api).toContain('`/workspaces/${id}`');
    expect(api).toContain('`/workspaces/${id}/archive`');
    expect(api).toContain('/workspaces/bootstrap');
  });

  it('auth gate restores a persisted workspace instead of always bootstrapping', () => {
    const gate = readSrc('./RequireAuth.tsx');
    expect(gate).toContain('resolveActiveWorkspace');
    expect(gate).toContain('api.getWorkspace');
  });
});
