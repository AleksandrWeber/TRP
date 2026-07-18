import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { setActiveWorkspace } from '../shared/auth';
import { useWorkspace, WorkspaceProvider } from './WorkspaceContext';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  };
}

function WorkspaceProbe() {
  const { activeWorkspace, setActiveWorkspace: selectWorkspace } = useWorkspace();
  return (
    <span data-can-select={typeof selectWorkspace === 'function'}>
      {activeWorkspace.id}:{activeWorkspace.name}
    </span>
  );
}

describe('WorkspaceContext (US003)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  it('provides the workspace established by the bootstrap flow', () => {
    setActiveWorkspace({ id: 'ws-1', name: 'Default Workspace' });

    const html = renderToStaticMarkup(
      <WorkspaceProvider>
        <WorkspaceProbe />
      </WorkspaceProvider>,
    );

    expect(html).toContain('ws-1:Default Workspace');
    expect(html).toContain('data-can-select="true"');
  });

  it('rejects workspace consumers outside the provider boundary', () => {
    expect(() => renderToStaticMarkup(<WorkspaceProbe />)).toThrow(
      'useWorkspace must be used within WorkspaceProvider',
    );
  });
});
