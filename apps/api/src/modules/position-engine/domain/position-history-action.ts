export const POSITION_HISTORY_ACTIONS = Object.freeze([
  'OPENED',
  'INCREASED',
  'REDUCED',
  'CLOSED',
  'MARKED',
] as const);

export type PositionHistoryAction = (typeof POSITION_HISTORY_ACTIONS)[number];

export function isPositionHistoryAction(value: string): value is PositionHistoryAction {
  return (POSITION_HISTORY_ACTIONS as readonly string[]).includes(value);
}

export function assertPositionHistoryAction(value: string): PositionHistoryAction {
  if (!isPositionHistoryAction(value)) {
    throw new Error(`invalid position history action: ${value}`);
  }
  return value;
}
