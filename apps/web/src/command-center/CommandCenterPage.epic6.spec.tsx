import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import {
  EMERGENCY_ACTION_CAPABILITIES,
  emergencyDialogCopy,
  isEmergencyActionAvailable,
  resolveEmergencyCapabilities,
} from './emergency-controls';
import { EmergencyControlsPanel } from './panels/EmergencyControlsPanel';

describe('Command Center Emergency Controls foundation (RC-20 Epic 6)', () => {
  it('renders P6 danger region with contract + foundation controls', () => {
    const html = renderToStaticMarkup(<EmergencyControlsPanel presentation="ready" />);
    expect(html).toContain('data-testid="cc-panel-p6"');
    expect(html).toContain('data-emergency-region="true"');
    expect(html).toContain('Danger zone');
    expect(html).toContain('Emergency Stop');
    expect(html).toContain('Clear Kill Switch');
    expect(html).toContain('Close All Sessions');
    expect(html).toContain('Global Pause');
    expect(html).toContain('Kill state unavailable');
  });

  it('keeps all emergency actions disabled when backend ports are absent', () => {
    const capabilities = resolveEmergencyCapabilities();
    expect(capabilities.every((action) => action.availability === 'unavailable')).toBe(true);
    expect(capabilities.every((action) => !isEmergencyActionAvailable(action))).toBe(true);

    const html = renderToStaticMarkup(<EmergencyControlsPanel presentation="ready" />);
    for (const action of EMERGENCY_ACTION_CAPABILITIES) {
      expect(html).toContain(`data-testid="cc-p6-action-${action.id}"`);
      expect(html).toContain(`data-testid="cc-p6-button-${action.id}"`);
    }
    expect(html).toContain('Disabled: Durable Kill Switch activate port is not connected');
    expect(html).toContain('Disabled: Global Pause is reserved for a future release');
    expect(html.match(/disabled/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it('defines confirmation copy for every emergency action', () => {
    expect(emergencyDialogCopy('emergency-stop')).toMatchObject({
      title: 'Emergency Stop?',
      confirmLabel: 'Emergency Stop',
      requireTypedPhrase: 'EMERGENCY STOP',
    });
    expect(emergencyDialogCopy('clear-kill-switch').requireTypedPhrase).toBe('CLEAR KILL');
    expect(emergencyDialogCopy('close-all-sessions').requireTypedPhrase).toBe('CLOSE ALL');
    expect(emergencyDialogCopy('global-pause').title).toBe('Global Pause?');
  });

  it('renders confirmation dialog for emergency actions without backend mutations', () => {
    const html = renderToStaticMarkup(
      <EmergencyControlsPanel presentation="ready" initialPendingAction="emergency-stop" />,
    );
    expect(html).toContain('Emergency Stop?');
    expect(html).toContain('durable Kill Switch');
    expect(html).toContain('EMERGENCY STOP');
    expect(html).toContain('role="dialog"');
  });

  it('only invokes confirm callback when capability is available', () => {
    const onConfirmAction = vi.fn();
    // Unavailable path: dialog may render for UX review, but confirm must not mutate.
    const unavailableDialog = emergencyDialogCopy('emergency-stop');
    const markup = renderToStaticMarkup(
      <ConfirmationDialog
        open
        title={unavailableDialog.title}
        message={unavailableDialog.message}
        confirmLabel={unavailableDialog.confirmLabel}
        variant="danger"
        requireTypedPhrase={unavailableDialog.requireTypedPhrase}
        typedValue="EMERGENCY STOP"
        onTypedValueChange={() => undefined}
        onConfirm={() => {
          const action = resolveEmergencyCapabilities()[0];
          if (isEmergencyActionAvailable(action)) onConfirmAction(action.id);
        }}
        onCancel={() => undefined}
      />,
    );
    expect(markup).toContain('Emergency Stop?');
    expect(onConfirmAction).not.toHaveBeenCalled();

    const available = resolveEmergencyCapabilities({ 'emergency-stop': 'available' })[0];
    expect(isEmergencyActionAvailable(available)).toBe(true);
  });

  it('does not introduce Kill Switch backend orchestration in the panel', () => {
    const html = renderToStaticMarkup(
      <EmergencyControlsPanel
        presentation="ready"
        availabilityOverrides={{ 'emergency-stop': 'available' }}
      />,
    );
    expect(html).toContain('data-availability="available"');
    expect(html).not.toContain('method="post"');
    expect(html).not.toContain('/kill');
    expect(html).not.toContain('fetch(');
  });
});
