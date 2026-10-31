/**
 * FIV-CONN-04-D Stage 4 — module-local D-path live-slot occupancy helper
 * (OQ-S4-03 Option A).
 *
 * Reuses the A Preflight Strategy-B collision projection algorithm and maps
 * results to the C occupancy contract `FivConn04LiveSlotOccupancy`.
 * Read/verification failure → `unavailable` (never coerced to vacant).
 * Not a Nest product module. Not write authority. Not exported from ConnectionsModule.
 */

import type { PrismaService } from '../../storage/prisma/prisma.module';
import type {
  FivConn04LiveConnectionInput,
  FivConn04LiveSlotOccupancy,
} from './fiv-conn-04-live-classifier';

/**
 * Resolve typed Strategy-B live-slot occupancy for a trusted Connection attempt.
 * Preserves A Preflight query semantics for EXCHANGE + NULL env + credentialed rows.
 */
export async function resolveFivConn04DLiveSlotOccupancy(
  prisma: PrismaService,
  connection: FivConn04LiveConnectionInput,
): Promise<FivConn04LiveSlotOccupancy> {
  try {
    if (connection.connectionType !== 'EXCHANGE') {
      return Object.freeze({ status: 'verified_vacant' });
    }
    if (connection.environment !== null) {
      return Object.freeze({ status: 'verified_vacant' });
    }
    if (connection.vaultSecretId === null || connection.vaultSecretId.trim().length === 0) {
      return Object.freeze({ status: 'verified_vacant' });
    }
    if (connection.status === 'REVOKED') {
      return Object.freeze({ status: 'verified_vacant' });
    }

    const occupant = await prisma.connectionRecord.findFirst({
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

    if (occupant?.id) {
      return Object.freeze({ status: 'occupied', occupantId: occupant.id });
    }
    return Object.freeze({ status: 'verified_vacant' });
  } catch {
    return Object.freeze({ status: 'unavailable' });
  }
}
