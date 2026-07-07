import WebSocket from 'ws';
import { WsMessage, WsEventType } from '@chess-online/shared';

type EventHandler = (socket: WebSocket, userId: string, payload: Record<string, unknown>) => void;

function sendMessage(socket: WebSocket, message: WsMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

class EventDispatcher {
  private handlers: Map<string, EventHandler> = new Map();

  registerHandler(type: string, handler: EventHandler): void {
    this.handlers.set(type, handler);
  }

  dispatch(socket: WebSocket, userId: string, rawMessage: string): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawMessage);
    } catch {
      sendMessage(socket, {
        type: WsEventType.ERROR,
        payload: { message: 'Invalid JSON' },
      });
      return;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).type !== 'string' ||
      typeof (parsed as Record<string, unknown>).payload !== 'object' ||
      (parsed as Record<string, unknown>).payload === null
    ) {
      sendMessage(socket, {
        type: WsEventType.ERROR,
        payload: { message: 'Invalid message format' },
      });
      return;
    }

    const message = parsed as WsMessage;
    const handler = this.handlers.get(message.type);

    if (!handler) {
      sendMessage(socket, {
        type: WsEventType.ERROR,
        payload: { message: 'Unknown event' },
      });
      return;
    }

    handler(socket, userId, message.payload as Record<string, unknown>);
  }
}

export const eventDispatcher = new EventDispatcher();

// ─── Register built-in handlers ───────────────────────────────────────────────

eventDispatcher.registerHandler(WsEventType.PING, (socket) => {
  sendMessage(socket, { type: WsEventType.PONG, payload: {} });
});
