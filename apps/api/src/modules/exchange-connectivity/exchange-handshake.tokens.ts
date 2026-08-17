export const HANDSHAKE_HTTP_CLIENT = Symbol('HANDSHAKE_HTTP_CLIENT');
export const HANDSHAKE_CLOCK = Symbol('HANDSHAKE_CLOCK');
export const HANDSHAKE_TIMEOUT_MS = Symbol('HANDSHAKE_TIMEOUT_MS');

export const DEFAULT_HANDSHAKE_TIMEOUT_MS = 10_000;

export type HandshakeClock = {
  nowMs(): number;
};

export const SYSTEM_HANDSHAKE_CLOCK: HandshakeClock = {
  nowMs: () => Date.now(),
};
