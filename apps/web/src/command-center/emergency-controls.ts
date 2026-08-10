/**
 * Emergency Controls interaction model (RC-20 Epic 6).
 * UI-only: availability reflects whether durable backend ports exist.
 * This module never performs emergency logic.
 */

export type EmergencyActionId =
  'emergency-stop' | 'clear-kill-switch' | 'close-all-sessions' | 'global-pause';

export type EmergencyAvailability = 'available' | 'unavailable';

export type EmergencyActionCapability = {
  id: EmergencyActionId;
  label: string;
  description: string;
  availability: EmergencyAvailability;
  /** Operator-facing reason when unavailable. */
  unavailableReason: string;
  /** Visual weight for dangerous actions. */
  danger: boolean;
};

/**
 * Current platform capabilities for Command Center Emergency Controls.
 * All actions stay unavailable until durable ports are wired in a later epic.
 */
export const EMERGENCY_ACTION_CAPABILITIES: readonly EmergencyActionCapability[] = [
  {
    id: 'emergency-stop',
    label: 'Emergency Stop',
    description: 'Activate durable Kill Switch. Blocks new execution per safety policy.',
    availability: 'unavailable',
    unavailableReason:
      'Durable Kill Switch activate port is not connected in this release. No UI-only kill is allowed.',
    danger: true,
  },
  {
    id: 'clear-kill-switch',
    label: 'Clear Kill Switch',
    description: 'Explicit elevated disarm of the durable Kill Switch.',
    availability: 'unavailable',
    unavailableReason:
      'Durable Kill Switch clear port is not connected in this release. Auto-clear is forbidden.',
    danger: true,
  },
  {
    id: 'close-all-sessions',
    label: 'Close All Sessions',
    description: 'Request an orderly close of all active sessions in scope.',
    availability: 'unavailable',
    unavailableReason:
      'Close All Sessions is not exposed by backend ports yet. Individual session Stop remains available.',
    danger: true,
  },
  {
    id: 'global-pause',
    label: 'Global Pause',
    description: 'Future workspace-wide pause. Reserved — not an executable control.',
    availability: 'unavailable',
    unavailableReason:
      'Global Pause is reserved for a future release. No backend capability exists yet.',
    danger: false,
  },
] as const;

export function resolveEmergencyCapabilities(
  overrides?: Partial<Record<EmergencyActionId, EmergencyAvailability>>,
): EmergencyActionCapability[] {
  return EMERGENCY_ACTION_CAPABILITIES.map((action) => {
    const availability = overrides?.[action.id] ?? action.availability;
    return { ...action, availability };
  });
}

export function isEmergencyActionAvailable(action: EmergencyActionCapability): boolean {
  return action.availability === 'available';
}

export function emergencyDialogCopy(actionId: EmergencyActionId): {
  title: string;
  message: string;
  confirmLabel: string;
  requireTypedPhrase?: string;
} {
  if (actionId === 'emergency-stop') {
    return {
      title: 'Emergency Stop?',
      message:
        'This will activate the durable Kill Switch and block new execution per safety policy. It does not delete ledger history. Confirmation is required before any backend call.',
      confirmLabel: 'Emergency Stop',
      requireTypedPhrase: 'EMERGENCY STOP',
    };
  }
  if (actionId === 'clear-kill-switch') {
    return {
      title: 'Clear Kill Switch?',
      message:
        'This will explicitly disarm the durable Kill Switch. Trading may resume only if Session / Risk policy allows. Elevated confirmation is required.',
      confirmLabel: 'Clear Kill Switch',
      requireTypedPhrase: 'CLEAR KILL',
    };
  }
  if (actionId === 'close-all-sessions') {
    return {
      title: 'Close All Sessions?',
      message:
        'This would request an orderly stop for every active session in scope. Individual ledgers are retained. This control is not backed by a port yet.',
      confirmLabel: 'Close All Sessions',
      requireTypedPhrase: 'CLOSE ALL',
    };
  }
  return {
    title: 'Global Pause?',
    message:
      'Global Pause is a future control for workspace-wide halt. It is not executable in this release and must not be emulated in the UI.',
    confirmLabel: 'Global Pause',
  };
}
