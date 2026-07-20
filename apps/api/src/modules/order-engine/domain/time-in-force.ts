export const TIME_IN_FORCE_VALUES = Object.freeze(['GTC', 'IOC', 'FOK', 'DAY'] as const);

export type TimeInForce = (typeof TIME_IN_FORCE_VALUES)[number];

export function isTimeInForce(value: string): value is TimeInForce {
  return (TIME_IN_FORCE_VALUES as readonly string[]).includes(value);
}

export function assertTimeInForce(value: string): TimeInForce {
  if (!isTimeInForce(value)) {
    throw new Error(`invalid time in force: ${value}`);
  }
  return value;
}
