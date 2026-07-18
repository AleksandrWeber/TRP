import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getActiveWorkspace,
  setActiveWorkspace as persistActiveWorkspace,
  subscribeToActiveWorkspace,
  type ActiveWorkspace,
} from '../shared/auth';

type WorkspaceContextValue = {
  activeWorkspace: ActiveWorkspace;
  setActiveWorkspace: (workspace: ActiveWorkspace) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/**
 * Reactive application boundary for the active workspace established by
 * LoginPage or RequireAuth. It does not own workspace discovery/bootstrap.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspace, setActiveWorkspaceState] = useState(getActiveWorkspace);

  useEffect(
    () => subscribeToActiveWorkspace((workspace) => setActiveWorkspaceState(workspace)),
    [],
  );

  const setActiveWorkspace = useCallback((workspace: ActiveWorkspace) => {
    persistActiveWorkspace(workspace);
  }, []);

  const value = useMemo(
    () => (activeWorkspace ? { activeWorkspace, setActiveWorkspace } : null),
    [activeWorkspace, setActiveWorkspace],
  );

  if (!value) {
    return null;
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
