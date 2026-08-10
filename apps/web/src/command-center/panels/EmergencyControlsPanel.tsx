import { useMemo, useState } from 'react';
import { ConfirmationDialog } from '../../shared/ConfirmationDialog';
import { OpsPanelFrame } from '../components/OpsPanelFrame';
import {
  emergencyDialogCopy,
  isEmergencyActionAvailable,
  resolveEmergencyCapabilities,
  type EmergencyActionCapability,
  type EmergencyActionId,
  type EmergencyAvailability,
} from '../emergency-controls';
import type { OpsPanelProps } from '../types';

type Props = OpsPanelProps & {
  /** Optional availability overrides (tests / review fixtures only). */
  availabilityOverrides?: Partial<Record<EmergencyActionId, EmergencyAvailability>>;
  /**
   * Called only when an available action is confirmed.
   * Epic 6 never wires backend mutations — callers must not emulate kill logic.
   */
  onConfirmAction?: (actionId: EmergencyActionId) => void;
  /** Review helper: open a confirmation dialog without enabling the action. */
  initialPendingAction?: EmergencyActionId | null;
};

/**
 * P6 — Emergency Controls foundation (RC-20 Epic 6).
 * Interaction model + disabled states only. No Kill Switch runtime.
 */
export function EmergencyControlsPanel({
  presentation = 'ready',
  errorMessage,
  availabilityOverrides,
  onConfirmAction,
  initialPendingAction = null,
}: Props) {
  const actions = useMemo(
    () => resolveEmergencyCapabilities(availabilityOverrides),
    [availabilityOverrides],
  );
  const [pending, setPending] = useState<EmergencyActionId | null>(initialPendingAction);
  const [typedPhrase, setTypedPhrase] = useState('');

  const pendingAction = pending ? (actions.find((action) => action.id === pending) ?? null) : null;
  const dialog = pending ? emergencyDialogCopy(pending) : null;

  return (
    <>
      <OpsPanelFrame
        panelId="P6"
        title="Emergency Controls"
        presentation={presentation}
        placeholderMessage="Kill Switch controls are not connected yet."
        emptyTitle="Kill Switch unavailable"
        emptyDescription="Blocks new execution per safety policy. Durable activate/clear arrives via safety ports — never a UI-only flag."
        errorMessage={errorMessage}
        skeletonRows={3}
      >
        <div
          className="rounded-lg border border-red-500/40 bg-red-950/40 p-3"
          data-testid="cc-p6-content"
          data-emergency-region="true"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-red-500/25 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">
                Danger zone
              </p>
              <p className="mt-1 text-sm text-red-100/90">
                Emergency actions require confirmation and durable backend ports.
              </p>
            </div>
            <span
              className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-red-200"
              data-testid="cc-p6-kill-state"
            >
              Kill state unavailable
            </span>
          </div>

          <p className="mt-3 text-xs text-red-200/80">
            Blocks new execution per safety policy when armed. UI never owns emergency truth.
          </p>

          <ul className="mt-4 space-y-3">
            {actions.map((action) => (
              <EmergencyActionRow
                key={action.id}
                action={action}
                onRequest={() => {
                  if (!isEmergencyActionAvailable(action)) return;
                  setTypedPhrase('');
                  setPending(action.id);
                }}
              />
            ))}
          </ul>
        </div>
      </OpsPanelFrame>

      {dialog && pending ? (
        <ConfirmationDialog
          open
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          variant="danger"
          requireTypedPhrase={dialog.requireTypedPhrase}
          typedValue={typedPhrase}
          onTypedValueChange={setTypedPhrase}
          onConfirm={() => {
            const actionId = pending;
            setPending(null);
            setTypedPhrase('');
            if (actionId && pendingAction && isEmergencyActionAvailable(pendingAction)) {
              onConfirmAction?.(actionId);
            }
          }}
          onCancel={() => {
            setPending(null);
            setTypedPhrase('');
          }}
        />
      ) : null}
    </>
  );
}

function EmergencyActionRow({
  action,
  onRequest,
}: {
  action: EmergencyActionCapability;
  onRequest: () => void;
}) {
  const available = isEmergencyActionAvailable(action);
  const buttonClass = action.danger
    ? 'rounded border border-red-400/50 bg-red-600/20 px-3 py-1.5 text-sm font-semibold text-red-50 hover:bg-red-600/30 disabled:cursor-not-allowed disabled:border-red-500/20 disabled:bg-red-950/30 disabled:text-red-300/50'
    : 'rounded border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500';

  return (
    <li
      className="rounded-md border border-red-500/20 bg-black/20 px-3 py-3"
      data-testid={`cc-p6-action-${action.id}`}
      data-availability={action.availability}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-red-50">{action.label}</p>
          <p className="text-xs text-slate-400">{action.description}</p>
          {!available ? (
            <p className="text-xs text-amber-200/90" data-testid="cc-p6-disabled-reason">
              Disabled: {action.unavailableReason}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={buttonClass}
          disabled={!available}
          aria-disabled={!available}
          data-testid={`cc-p6-button-${action.id}`}
          onClick={onRequest}
        >
          {action.label}
        </button>
      </div>
    </li>
  );
}
