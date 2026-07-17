import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from './repositories/in-memory-workspace.repository';
import { WorkspaceDomainService } from './workspace-domain.service';
import { WorkspaceStatus } from './workspace-status';

describe('WorkspaceDomainService (US108)', () => {
  let service: WorkspaceDomainService;

  beforeEach(() => {
    service = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
  });

  it('creates an active workspace with required fields', () => {
    const workspace = service.create({
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

  it('defaults createdAt to an ISO timestamp', () => {
    const workspace = service.create({
      name: 'Lab',
      ownerUserId: 'user-1',
    });

    expect(Number.isNaN(Date.parse(workspace.createdAt))).toBe(false);
  });

  it('rejects empty name or ownerUserId', () => {
    expect(() => service.create({ name: '  ', ownerUserId: 'user-1' })).toThrow(/name/i);
    expect(() => service.create({ name: 'Lab', ownerUserId: '  ' })).toThrow(/ownerUserId/i);
  });

  it('getById returns workspace or null', () => {
    const created = service.create({ name: 'Lab', ownerUserId: 'user-1' });

    expect(service.getById(created.id)).toEqual(created);
    expect(service.getById('missing')).toBeNull();
  });

  it('findByOwner returns workspaces for that owner only', () => {
    const a1 = service.create({ name: 'A1', ownerUserId: 'owner-a' });
    const a2 = service.create({ name: 'A2', ownerUserId: 'owner-a' });
    service.create({ name: 'B1', ownerUserId: 'owner-b' });

    const found = service.findByOwner('owner-a');

    expect(found.map((item) => item.id).sort()).toEqual([a1.id, a2.id].sort());
  });

  it('rename updates name', () => {
    const created = service.create({ name: 'Old', ownerUserId: 'user-1' });

    const renamed = service.rename(created.id, ' New Name ');

    expect(renamed?.name).toBe('New Name');
    expect(service.getById(created.id)?.name).toBe('New Name');
  });

  it('rename returns null when workspace is missing', () => {
    expect(service.rename('missing', 'X')).toBeNull();
  });

  it('archive sets status to Archived', () => {
    const created = service.create({ name: 'Lab', ownerUserId: 'user-1' });

    const archived = service.archive(created.id);

    expect(archived?.status).toBe(WorkspaceStatus.Archived);
    expect(service.getById(created.id)?.status).toBe(WorkspaceStatus.Archived);
  });

  it('archive returns null when workspace is missing', () => {
    expect(service.archive('missing')).toBeNull();
  });
});
