import {
  WS_CLOSED,
  WS_CLOSING,
  WS_CONNECTING,
  WS_OPEN,
  type WebSocketLike,
} from './websocket-like';

type Listener = (event: unknown) => void;

/**
 * In-memory WebSocket double for US133 tests.
 * No network I/O.
 */
export class FakeWebSocket implements WebSocketLike {
  readyState = WS_CONNECTING;
  readonly sent: string[] = [];
  private readonly listeners = new Map<string, Set<Listener>>();
  private closed = false;

  constructor(readonly url: string) {}

  addEventListener(type: 'open' | 'message' | 'close' | 'error', listener: Listener): void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: 'open' | 'message' | 'close' | 'error', listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  send(data: string): void {
    if (this.readyState !== WS_OPEN) {
      throw new Error('FakeWebSocket is not open');
    }
    this.sent.push(data);
  }

  close(code = 1000, reason = ''): void {
    if (this.closed) return;
    this.closed = true;
    this.readyState = WS_CLOSING;
    this.readyState = WS_CLOSED;
    this.emit('close', { code, reason });
  }

  /** Test helper — complete handshake. */
  open(): void {
    this.readyState = WS_OPEN;
    this.emit('open', {});
  }

  /** Test helper — deliver a server message. */
  receive(data: unknown): void {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.emit('message', { data: payload });
  }

  /** Test helper — emit error. */
  error(message: string): void {
    this.emit('error', { message });
  }

  private emit(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

export function createFakeWebSocketFactory(
  sockets: FakeWebSocket[],
): (url: string) => WebSocketLike {
  return (url: string) => {
    const socket = new FakeWebSocket(url);
    sockets.push(socket);
    // Auto-open on next microtask to mimic async connect.
    queueMicrotask(() => {
      if (socket.readyState === WS_CONNECTING) socket.open();
    });
    return socket;
  };
}
