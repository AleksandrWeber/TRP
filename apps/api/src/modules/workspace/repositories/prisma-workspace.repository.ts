import type { PrismaClient, WorkspaceRecord } from '@prisma/client';
import type { Workspace } from '../workspace';
import { toWorkspaceId, type WorkspaceId } from '../workspace-id';
import { WorkspaceStatus } from '../workspace-status';
import type { WorkspaceRepository } from './workspace.repository';

export class PrismaWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(workspace: Workspace): Promise<void> {
    await this.prisma.workspaceRecord.upsert({
      where: { id: workspace.id },
      create: {
        id: workspace.id,
        name: workspace.name,
        ownerUserId: workspace.ownerUserId,
        status: workspace.status,
        createdAt: new Date(workspace.createdAt),
      },
      update: {
        name: workspace.name,
        ownerUserId: workspace.ownerUserId,
        status: workspace.status,
      },
    });
  }

  async findById(id: WorkspaceId | string): Promise<Workspace | null> {
    const row = await this.prisma.workspaceRecord.findUnique({ where: { id: String(id) } });
    return row ? toDomain(row) : null;
  }

  async findByOwnerUserId(ownerUserId: string): Promise<Workspace[]> {
    const rows = await this.prisma.workspaceRecord.findMany({
      where: { ownerUserId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async findAll(): Promise<Workspace[]> {
    const rows = await this.prisma.workspaceRecord.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: WorkspaceRecord): Workspace {
  if (!Object.values(WorkspaceStatus).includes(row.status as WorkspaceStatus)) {
    throw new Error(`unsupported Workspace status: ${row.status}`);
  }
  return {
    id: toWorkspaceId(row.id),
    name: row.name,
    ownerUserId: row.ownerUserId,
    status: row.status as WorkspaceStatus,
    createdAt: row.createdAt.toISOString(),
  };
}
