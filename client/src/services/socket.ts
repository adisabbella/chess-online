import { WsMessage } from '@chess-online/shared';

export type SocketStatus = 'connecting' | 'connected' | 'disconnected';

type MessageListener = (payload: Record<string, unknown>) => void;
type StatusListener = (status: SocketStatus) => void;

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = `${WS_PROTOCOL}//${window.location.host}/ws`;

/** Milliseconds to wait before attempting to reconnect after a drop. */
const RECONNECT_DELAY_MS = 2000;

class SocketService {
  private socket: WebSocket | null = null;
  private status: SocketStatus = 'disconnected';
  private messageListeners: Map<string, Set<MessageListener>> = new Map();
  private statusListeners: Set<StatusListener> = new Set();
  /**
   * Whether the SocketService has been asked to stay connected.
   * Set to true by `connect()`, false by `disconnect()`.
   * When false, the auto-reconnect loop is suppressed.
   */
  private shouldReconnect = false;

  connect(): void {
    this.shouldReconnect = true;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) return;

    this.openSocket();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  send(type: string, payload: Record<string, unknown> = {}): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const message: WsMessage = { type, payload };
    this.socket.send(JSON.stringify(message));
  }

  on(type: string, listener: MessageListener): void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, new Set());
    }
    this.messageListeners.get(type)!.add(listener);
  }

  off(type: string, listener: MessageListener): void {
    this.messageListeners.get(type)?.delete(listener);
  }

  onStatusChange(listener: StatusListener): void {
    this.statusListeners.add(listener);
  }

  offStatusChange(listener: StatusListener): void {
    this.statusListeners.delete(listener);
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  private openSocket(): void {
    this.setStatus('connecting');
    this.socket = new WebSocket(WS_URL);

    this.socket.addEventListener('open', () => {
      this.setStatus('connected');
    });

    this.socket.addEventListener('message', (event: MessageEvent<string>) => {
      this.handleMessage(event.data);
    });

    this.socket.addEventListener('close', () => {
      this.socket = null;
      this.setStatus('disconnected');

      // Auto-reconnect: attempt to re-establish the connection after a short
      // delay. This handles browser-refresh reconnects and temporary network
      // drops. Stopped only when `disconnect()` is called explicitly.
      if (this.shouldReconnect) {
        setTimeout(() => {
          if (this.shouldReconnect) {
            this.openSocket();
          }
        }, RECONNECT_DELAY_MS);
      }
    });

    this.socket.addEventListener('error', () => {
      // The 'close' event fires after 'error' — let the close handler manage
      // cleanup and reconnect scheduling.
      this.socket = null;
      this.setStatus('disconnected');
    });
  }

  private setStatus(status: SocketStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private handleMessage(raw: string): void {
    let message: unknown;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (
      typeof message !== 'object' ||
      message === null ||
      typeof (message as Record<string, unknown>).type !== 'string'
    ) {
      return;
    }

    const { type, payload } = message as WsMessage;
    const listeners = this.messageListeners.get(type);
    if (listeners) {
      listeners.forEach((listener) =>
        listener((payload ?? {}) as Record<string, unknown>),
      );
    }
  }
}

export const socketService = new SocketService();
