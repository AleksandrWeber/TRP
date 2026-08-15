import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorkspaceNameDialog } from './WorkspaceNameDialog';
import { WorkspaceSwitcherPanel } from './WorkspaceSwitcherPanel';

describe('WorkspaceSwitcher UI (PC-14)', () => {
  it('lists workspaces, marks the current one, and exposes create / rename / archive', () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcherPanel
        workspaces={[
          { id: 'ws-1', name: 'Default Workspace' },
          { id: 'ws-2', name: 'Paper Lab' },
        ]}
        activeWorkspaceId="ws-2"
        loading={false}
        error={null}
        onSelect={() => undefined}
        onCreate={() => undefined}
        onRename={() => undefined}
        onArchive={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Workspaces"');
    expect(html).toContain('Default Workspace');
    expect(html).toContain('Paper Lab');
    expect(html).toContain('Current workspace');
    expect(html).toContain('Create workspace');
    expect(html).toContain('Rename');
    expect(html).toContain('Archive');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toContain('placeholder');
  });

  it('shows an empty state when the operator has no workspaces', () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcherPanel
        workspaces={[]}
        activeWorkspaceId="ws-1"
        loading={false}
        error={null}
        onSelect={() => undefined}
        onCreate={() => undefined}
        onRename={() => undefined}
        onArchive={() => undefined}
      />,
    );

    expect(html).toContain('No workspaces yet');
    expect(html).toContain('Create a workspace to continue working.');
    expect(html).toContain('Create workspace');
  });

  it('shows loading and error states', () => {
    const loading = renderToStaticMarkup(
      <WorkspaceSwitcherPanel
        workspaces={[]}
        activeWorkspaceId="ws-1"
        loading
        error={null}
        onSelect={() => undefined}
        onCreate={() => undefined}
        onRename={() => undefined}
        onArchive={() => undefined}
      />,
    );
    const failed = renderToStaticMarkup(
      <WorkspaceSwitcherPanel
        workspaces={[]}
        activeWorkspaceId="ws-1"
        loading={false}
        error="Could not load workspaces."
        onSelect={() => undefined}
        onCreate={() => undefined}
        onRename={() => undefined}
        onArchive={() => undefined}
      />,
    );

    expect(loading).toContain('Loading workspaces…');
    expect(failed).toContain('role="alert"');
    expect(failed).toContain('Could not load workspaces.');
  });

  it('renders create and rename dialogs with validation surface', () => {
    const create = renderToStaticMarkup(
      <WorkspaceNameDialog
        open
        title="Create workspace"
        confirmLabel="Create"
        name=""
        fieldError="Enter a workspace name."
        loading={false}
        onNameChange={() => undefined}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    const rename = renderToStaticMarkup(
      <WorkspaceNameDialog
        open
        title="Rename workspace"
        confirmLabel="Rename"
        name="Paper Lab"
        fieldError={null}
        loading
        onNameChange={() => undefined}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );

    expect(create).toContain('Create workspace');
    expect(create).toContain('Enter a workspace name.');
    expect(rename).toContain('Rename workspace');
    expect(rename).toContain('Saving…');
  });
});
