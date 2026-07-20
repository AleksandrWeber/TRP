export const POSITION_SIDES = Object.freeze(['LONG', 'SHORT'] as const);

export type PositionSide = (typeof POSITION_SIDES)[number];

export function isPositionSide(value: string): value is PositionSide {
  return (POSITION_SIDES as readonly string[]).includes(value);
}

export function assertPositionSide(value: string): PositionSide {
  if (!isPositionSide(value)) {
    throw new Error(`invalid position side: ${value}`);
  }
  return value;
}
