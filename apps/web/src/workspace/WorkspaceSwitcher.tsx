import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type WorkspaceView } from '../shared/api';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { toUserFacingError } from '../shared/mapApiError';
import { WorkspaceNameDialog } from './WorkspaceNameDialog';
import { WorkspaceSwitcherPanel, type WorkspaceListItem } from './WorkspaceSwitcherPanel';
import { validateWorkspaceName } from './workspace-name';

type NameDialog = {
  mode: 'create' | 'rename';
  workspace?: WorkspaceListItem;
  name: string;
};

export function WorkspaceSwitcher() {
  const { activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameDialog, setNameDialog] = useState<NameDialog | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<WorkspaceListItem | null>(null);

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const listed = await api.listWorkspaces();
      setWorkspaces(listed.map(toListItem));
    } catch (err) {
      setError(toUserFacingError(err, 'Could not load workspaces.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadWorkspaces();
  }, [open, loadWorkspaces]);

  async function selectWorkspace(workspace: WorkspaceListItem) {
    if (workspace.id === activeWorkspace.id) {
      setOpen(false);
      return;
    }
    setError(null);
    try {
      const current = await api.getWorkspace(workspace.id);
      setActiveWorkspace({ id: current.id, name: current.name });
      setOpen(false);
    } catch (err) {
      setError(toUserFacingError(err, 'Could not switch workspace.'));
      void loadWorkspaces();
    }
  }

  function openCreate() {
    setNameError(null);
    setNameDialog({ mode: 'create', name: '' });
  }

  function openRename(workspace: WorkspaceListItem) {
    setNameError(null);
    setNameDialog({ mode: 'rename', workspace, name: workspace.name });
  }

  async function confirmNameDialog() {
    if (!nameDialog || saving) return;
    const invalid = validateWorkspaceName(nameDialog.name);
    if (invalid) {
      setNameError(invalid);
      return;
    }
    setSaving(true);
    setNameError(null);
    try {
      if (nameDialog.mode === 'create') {
        const created = await api.createWorkspace(nameDialog.name.trim());
        setActiveWorkspace({ id: created.id, name: created.name });
        setWorkspaces((current) => [...current, toListItem(created)]);
      } else if (nameDialog.workspace) {
        const renamed = await api.renameWorkspace(nameDialog.workspace.id, nameDialog.name.trim());
        setWorkspaces((current) =>
          current.map((item) => (item.id === renamed.id ? toListItem(renamed) : item)),
        );
        if (renamed.id === activeWorkspace.id) {
          setActiveWorkspace({ id: renamed.id, name: renamed.name });
        }
      }
      setNameDialog(null);
    } catch (err) {
      setNameError(toUserFacingError(err, 'Could not save the workspace.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.archiveWorkspace(archiveTarget.id);
      const remaining = workspaces.filter((item) => item.id !== archiveTarget.id);
      setWorkspaces(remaining);
      if (archiveTarget.id === activeWorkspace.id) {
        const next = remaining[0];
        if (next) {
          const current = await api.getWorkspace(next.id);
          setActiveWorkspace({ id: current.id, name: current.name });
        } else {
          const created = await api.bootstrapWorkspace();
          setActiveWorkspace({ id: created.id, name: created.name });
          await loadWorkspaces();
        }
      }
      setArchiveTarget(null);
    } catch (err) {
      setError(toUserFacingError(err, 'Could not archive the workspace.'));
      setArchiveTarget(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative mt-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch workspace"
        onClick={() => setOpen((current) => !current)}
        className="text-left text-xs text-slate-500 hover:text-slate-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
      >
        {activeWorkspace.name}
      </button>
      {open ? (
        <WorkspaceSwitcherPanel
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspace.id}
          loading={loading}
          error={error}
          onSelect={(workspace) => void selectWorkspace(workspace)}
          onCreate={openCreate}
          onRename={openRename}
          onArchive={setArchiveTarget}
        />
      ) : null}
      <WorkspaceNameDialog
        open={Boolean(nameDialog)}
        title={nameDialog?.mode === 'rename' ? 'Rename workspace' : 'Create workspace'}
        confirmLabel={nameDialog?.mode === 'rename' ? 'Rename' : 'Create'}
        name={nameDialog?.name ?? ''}
        fieldError={nameError}
        loading={saving}
        onNameChange={(value) => {
          setNameDialog((current) => (current ? { ...current, name: value } : current));
          setNameError(null);
        }}
        onConfirm={() => void confirmNameDialog()}
        onCancel={() => {
          if (!saving) setNameDialog(null);
        }}
      />
      <ConfirmationDialog
        open={Boolean(archiveTarget)}
        title="Archive workspace"
        message={
          archiveTarget
            ? `Archive “${archiveTarget.name}”? It will leave the switcher. Work already in this workspace stays in this workspace.`
            : ''
        }
        confirmLabel={saving ? 'Archiving…' : 'Archive'}
        variant="danger"
        onConfirm={() => void confirmArchive()}
        onCancel={() => {
          if (!saving) setArchiveTarget(null);
        }}
      />
    </div>
  );
}

function toListItem(workspace: WorkspaceView): WorkspaceListItem {
  return { id: workspace.id, name: workspace.name };
}
