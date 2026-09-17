/**
 * PROPOSED-V3-L01-S04 — Map durable Kill Switch state to admission input (PO-S04-04 / 15).
 * Uses canonical WorkspaceKillSwitchState / isKillSwitchArmed — not recovery stub.
 */

import {
  isKillSwitchArmed,
  type DurableKillSwitchState,
} from '../../domain/durable-kill-switch-state';
import type { LiveAdmissionKillSwitchInput } from './decide-live-admission';

export type KillSwitchLoadResult =
  | Readonly<{ status: 'ok'; state: DurableKillSwitchState | null }>
  | Readonly<{ status: 'unavailable' }>
  | Readonly<{ status: 'unknown' }>;

export function mapKillSwitchToAdmissionInput(
  load: KillSwitchLoadResult,
): LiveAdmissionKillSwitchInput {
  if (load.status === 'unavailable') return 'unavailable';
  if (load.status === 'unknown') return 'unknown';
  return isKillSwitchArmed(load.state) ? 'active' : 'inactive';
}
