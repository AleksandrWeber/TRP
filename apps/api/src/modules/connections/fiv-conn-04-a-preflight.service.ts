/**
 * FIV-CONN-04-A — Target inventory + read-only preflight service.
 *
 * Loads Connection rows and Vault *metadata* only. Never UPDATEs environment,
 * never mutates Vault/credentials, never performs venue I/O.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import type { Role } from '../identity/role';
import { SecretVaultService } from '../secret-vault';
import type { SecretVaultMetadata } from '../secret-vault/secret-record';
import {
  buildFivConn04APreflightReport,
  classifyFivConn04AConnection,
  type FivConn04AConnectionInput,
  type FivConn04APreflightReport,
  type FivConn04ARowResult,
  type FivConn04AVaultMetaInput,
} from './fiv-conn-04-a-classification';

export type FivConn04APreflightInput = Readonly<{
  /** Authenticated actor for Vault workspace-scoped metadata list. */
  actorUserId: string;
  actorRole: Role;
  /** When set, scan only this workspace; otherwise scan all Connection workspaces. */
  workspaceId?: string;
}>;

type ConnectionScanRow = {
  id: string;
  workspaceId: string;
  provider: string;
  connectionType: string;
  environment: string | null;
  vaultSecretId: string | null;
  status: string;
};

@Injectable()
export class FivConn04APreflightService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vault: SecretVaultService,
  ) {}

  /**
   * Run a deterministic read-only inventory/preflight.
   * Uses Prisma findMany/findFirst and Vault list metadata only.
   */
  async run(input: FivConn04APreflightInput): Promise<FivConn04APreflightReport> {
    const connections = await this.loadConnections(input.workspaceId);
    const vaultMetaByWorkspace = await this.loadVaultMetadataByWorkspace(
      input,
      connections.map((row) => row.workspaceId),
    );

    const results: FivConn04ARowResult[] = [];
    for (const row of connections) {
      results.push(await this.classifyRow(row, vaultMetaByWorkspace.get(row.workspaceId) ?? []));
    }

    return buildFivConn04APreflightReport(results);
  }

  private async loadConnections(workspaceId: string | undefined): Promise<ConnectionScanRow[]> {
    const rows = await this.prisma.connectionRecord.findMany({
      where: workspaceId !== undefined ? { workspaceId } : undefined,
      orderBy: [{ workspaceId: 'asc' }, { provider: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        workspaceId: true,
        provider: true,
        connectionType: true,
        environment: true,
        vaultSecretId: true,
        status: true,
      },
    });
    return rows;
  }

  private async loadVaultMetadataByWorkspace(
    input: FivConn04APreflightInput,
    workspaceIds: readonly string[],
  ): Promise<Map<string, readonly SecretVaultMetadata[]>> {
    const unique = [...new Set(workspaceIds)].sort((a, b) => a.localeCompare(b));
    const map = new Map<string, readonly SecretVaultMetadata[]>();
    for (const workspaceId of unique) {
      const listed = await this.vault.list(input.actorUserId, workspaceId, input.actorRole);
      map.set(workspaceId, listed);
    }
    return map;
  }

  private async classifyRow(
    row: ConnectionScanRow,
    workspaceVaultMeta: readonly SecretVaultMetadata[],
  ): Promise<FivConn04ARowResult> {
    const connection: FivConn04AConnectionInput = {
      id: row.id,
      workspaceId: row.workspaceId,
      provider: row.provider,
      connectionType: row.connectionType,
      environment: row.environment,
      vaultSecretId: row.vaultSecretId,
      status: row.status,
    };

    const vaultMeta = this.resolveExactVaultMeta(connection, workspaceVaultMeta);
    const liveSlotOccupantId = await this.findLiveStrategyBOccupant(connection);

    return classifyFivConn04AConnection(connection, vaultMeta, liveSlotOccupantId);
  }

  /**
   * Exact vaultSecretId match within the Connection workspace list.
   * Never provider-only / sibling / first-match selection.
   */
  private resolveExactVaultMeta(
    connection: FivConn04AConnectionInput,
    workspaceVaultMeta: readonly SecretVaultMetadata[],
  ): FivConn04AVaultMetaInput | null {
    const vaultSecretId = connection.vaultSecretId?.trim() ?? '';
    if (vaultSecretId.length === 0) {
      return null;
    }
    const match = workspaceVaultMeta.find((meta) => meta.id === vaultSecretId);
    if (!match) {
      return null;
    }
    return {
      id: match.id,
      workspaceId: match.workspaceId,
      purpose: match.purpose,
      state: match.state,
    };
  }

  /**
   * Strategy B collision projection for assigning LIVE to this credentialed NULL row.
   * DB remains final uniqueness authority; this is read-only preflight only.
   */
  private async findLiveStrategyBOccupant(
    connection: FivConn04AConnectionInput,
  ): Promise<string | null> {
    if (connection.connectionType !== 'EXCHANGE') {
      return null;
    }
    if (connection.environment !== null) {
      return null;
    }
    if (connection.vaultSecretId === null || connection.vaultSecretId.trim().length === 0) {
      return null;
    }
    if (connection.status === 'REVOKED') {
      return null;
    }

    const occupant = await this.prisma.connectionRecord.findFirst({
      where: {
        workspaceId: connection.workspaceId,
        provider: connection.provider,
        environment: 'live',
        connectionType: 'EXCHANGE',
        vaultSecretId: { not: null },
        status: { not: 'REVOKED' },
        id: { not: connection.id },
      },
      select: { id: true },
    });
    return occupant?.id ?? null;
  }
}
