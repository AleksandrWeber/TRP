export type WorkspaceListItem = {
  id: string;
  name: string;
};

type Props = {
  workspaces: WorkspaceListItem[];
  activeWorkspaceId: string;
  loading: boolean;
  error: string | null;
  onSelect: (workspace: WorkspaceListItem) => void;
  onCreate: () => void;
  onRename: (workspace: WorkspaceListItem) => void;
  onArchive: (workspace: WorkspaceListItem) => void;
};

export function WorkspaceSwitcherPanel({
  workspaces,
  activeWorkspaceId,
  loading,
  error,
  onSelect,
  onCreate,
  onRename,
  onArchive,
}: Props) {
  return (
    <div
      className="absolute left-0 top-full z-40 mt-2 w-80 rounded-lg border border-white/15 bg-slate-950 p-3 shadow-xl"
      role="menu"
      aria-label="Workspaces"
    >
      {loading ? <p className="px-2 py-3 text-sm text-slate-400">Loading workspaces…</p> : null}
      {error ? (
        <p role="alert" className="px-2 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {!loading && workspaces.length === 0 ? (
        <div className="px-2 py-3">
          <p className="text-sm text-slate-300">No workspaces yet</p>
          <p className="mt-1 text-xs text-slate-500">Create a workspace to continue working.</p>
        </div>
      ) : null}
      {!loading && workspaces.length > 0 ? (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {workspaces.map((workspace) => {
            const current = workspace.id === activeWorkspaceId;
            return (
              <li key={workspace.id}>
                <div
                  className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                    current ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => onSelect(workspace)}
                    className="min-w-0 flex-1 text-left text-sm text-slate-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
                  >
                    <span className="block truncate">{workspace.name}</span>
                    {current ? (
                      <span className="text-xs text-slate-400">Current workspace</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRename(workspace)}
                    className="shrink-0 text-xs text-slate-400 hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchive(workspace)}
                    className="shrink-0 text-xs text-slate-400 hover:text-red-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
                  >
                    Archive
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={onCreate}
        className="mt-3 w-full rounded border border-white/15 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
      >
        Create workspace
      </button>
    </div>
  );
}
