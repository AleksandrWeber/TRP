export const POSITION_STATUSES = Object.freeze([
  'OPEN',
  'PARTIALLY_CLOSED',
  'CLOSED',
  'LIQUIDATED',
] as const);

export type PositionStatus = (typeof POSITION_STATUSES)[number];

export const OPEN_POSITION_STATUSES = Object.freeze(['OPEN', 'PARTIALLY_CLOSED'] as const);

export function isPositionStatus(value: string): value is PositionStatus {
  return (POSITION_STATUSES as readonly string[]).includes(value);
}

export function assertPositionStatus(value: string): PositionStatus {
  if (!isPositionStatus(value)) {
    throw new Error(`invalid position status: ${value}`);
  }
  return value;
}

export function isOpenPositionStatus(status: PositionStatus): boolean {
  return (OPEN_POSITION_STATUSES as readonly string[]).includes(status);
}
