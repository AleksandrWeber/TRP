/** Presentation modes for Command Center panels. */
export type PanelPresentation = 'placeholder' | 'loading' | 'empty' | 'ready' | 'error';

export type OpsPanelProps = {
  presentation?: PanelPresentation;
  errorMessage?: string | null;
};

export const COMMAND_CENTER_PATH = '/command-center';

export const COMMAND_CENTER_PANELS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'] as const;

export type CommandCenterPanelId = (typeof COMMAND_CENTER_PANELS)[number];

/** Non-terminal Trading Session statuses (ADR-014). */
export const ACTIVE_SESSION_STATUSES = new Set([
  'created',
  'starting',
  'running',
  'paused',
  'stopping',
  'recovering',
]);

export const TERMINAL_SESSION_STATUSES = new Set(['stopped', 'failed']);
