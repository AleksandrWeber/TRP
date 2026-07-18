import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from './repositories/in-memory-workspace.repository';
import { WorkspaceDomainService } from './workspace-domain.service';
import { WorkspaceStatus } from './workspace-status';

describe('WorkspaceDomainService (US108)', () => {
  let service: WorkspaceDomainService;

  beforeEach(() => {
    service = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
  });

  it('creates an active workspace with required fields', async () => {
    const workspace = await service.create({
      name: ' Research Lab ',
      ownerUserId: ' user-1 ',
      createdAt: '2026-07-17T00:00:00.000Z',
    });

    expect(workspace.id.length).toBeGreaterThan(0);
    expect(workspace.name).toBe('Research Lab');
    expect(workspace.ownerUserId).toBe('user-1');
    expect(workspace.status).toBe(WorkspaceStatus.Active);
    expect(workspace.createdAt).toBe('2026-07-17T00:00:00.000Z');
    expect(Object.keys(workspace).sort()).toEqual([
      'createdAt',
      'id',
      'name',
      'ownerUserId',
      'status',
    ]);
  });

  it('defaults createdAt to an ISO timestamp', async () => {
    const workspace = await service.create({
      name: 'Lab',
      ownerUserId: 'user-1',
    });

    expect(Number.isNaN(Date.parse(workspace.createdAt))).toBe(false);
  });

  it('rejects empty name or ownerUserId', async () => {
    await expect(service.create({ name: '  ', ownerUserId: 'user-1' })).rejects.toThrow(/name/i);
    await expect(service.create({ name: 'Lab', ownerUserId: '  ' })).rejects.toThrow(
      /ownerUserId/i,
    );
  });

  it('getById returns workspace or null', async () => {
    const created = await service.create({ name: 'Lab', ownerUserId: 'user-1' });

    expect(service.getById(created.id)).toEqual(created);
    expect(service.getById('missing')).toBeNull();
  });

  it('findByOwner returns workspaces for that owner only', async () => {
    const a1 = await service.create({ name: 'A1', ownerUserId: 'owner-a' });
    const a2 = await service.create({ name: 'A2', ownerUserId: 'owner-a' });
    await service.create({ name: 'B1', ownerUserId: 'owner-b' });

    const found = service.findByOwner('owner-a');

    expect(found.map((item) => item.id).sort()).toEqual([a1.id, a2.id].sort());
  });

  it('rename updates name', async () => {
    const created = await service.create({ name: 'Old', ownerUserId: 'user-1' });

    const renamed = await service.rename(created.id, ' New Name ');

    expect(renamed?.name).toBe('New Name');
    expect(service.getById(created.id)?.name).toBe('New Name');
  });

  it('rename returns null when workspace is missing', async () => {
    await expect(service.rename('missing', 'X')).resolves.toBeNull();
  });

  it('archive sets status to Archived', async () => {
    const created = await service.create({ name: 'Lab', ownerUserId: 'user-1' });

    const archived = await service.archive(created.id);

    expect(archived?.status).toBe(WorkspaceStatus.Archived);
    expect(service.getById(created.id)?.status).toBe(WorkspaceStatus.Archived);
  });

  it('archive returns null when workspace is missing', async () => {
    await expect(service.archive('missing')).resolves.toBeNull();
  });

  it('bootstrapForOwner creates a default workspace when none exist', async () => {
    const workspace = await service.bootstrapForOwner('user-1');

    expect(workspace.name).toBe('Default Workspace');
    expect(workspace.ownerUserId).toBe('user-1');
    expect(workspace.status).toBe(WorkspaceStatus.Active);
  });

  it('bootstrapForOwner returns the earliest active workspace', async () => {
    const first = await service.create({
      name: 'First',
      ownerUserId: 'user-1',
      createdAt: '2026-07-17T00:00:00.000Z',
    });
    await service.create({
      name: 'Second',
      ownerUserId: 'user-1',
      createdAt: '2026-07-18T00:00:00.000Z',
    });
    await service.create({
      name: 'Other',
      ownerUserId: 'user-2',
      createdAt: '2026-07-16T00:00:00.000Z',
    });

    const workspace = await service.bootstrapForOwner('user-1');

    expect(workspace.id).toBe(first.id);
    expect(workspace.name).toBe('First');
  });

  it('bootstrapForOwner ignores archived workspaces and creates when needed', async () => {
    const archived = await service.create({ name: 'Old', ownerUserId: 'user-1' });
    await service.archive(archived.id);

    const workspace = await service.bootstrapForOwner('user-1');

    expect(workspace.id).not.toBe(archived.id);
    expect(workspace.status).toBe(WorkspaceStatus.Active);
    expect(workspace.name).toBe('Default Workspace');
  });

  it('bootstrapForOwner is idempotent for concurrent callers', async () => {
    const [a, b, c] = await Promise.all([
      service.bootstrapForOwner('user-1'),
      service.bootstrapForOwner('user-1'),
      service.bootstrapForOwner('user-1'),
    ]);

    expect(a.id).toBe(b.id);
    expect(b.id).toBe(c.id);
    expect(service.findByOwner('user-1')).toHaveLength(1);
  });
});
