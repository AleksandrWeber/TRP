/**
 * Paper trading session status (US208).
 */
export const PAPER_SESSION_STATUSES = Object.freeze([
  'CREATED',
  'RUNNING',
  'PAUSED',
  'STOPPED',
  'COMPLETED',
  'ARCHIVED',
] as const);

export type PaperSessionStatus = (typeof PAPER_SESSION_STATUSES)[number];

export function isPaperSessionStatus(value: string): value is PaperSessionStatus {
  return (PAPER_SESSION_STATUSES as readonly string[]).includes(value);
}

export function assertPaperSessionStatus(value: string): PaperSessionStatus {
  if (!isPaperSessionStatus(value)) {
    throw new Error(`invalid paper session status: ${value}`);
  }
  return value;
}

export const TERMINAL_PAPER_SESSION_STATUSES = Object.freeze([
  'STOPPED',
  'COMPLETED',
  'ARCHIVED',
] as const);

export function isTerminalPaperSessionStatus(status: PaperSessionStatus): boolean {
  return (TERMINAL_PAPER_SESSION_STATUSES as readonly string[]).includes(status);
}
