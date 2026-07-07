import { useEffect, useState, useCallback } from 'react';
import { socketService, SocketStatus } from '../services/socket';

interface UseWebSocketResult {
  status: SocketStatus;
  send: (type: string, payload?: Record<string, unknown>) => void;
  on: (type: string, listener: (payload: Record<string, unknown>) => void) => void;
  off: (type: string, listener: (payload: Record<string, unknown>) => void) => void;
}

export function useWebSocket(): UseWebSocketResult {
  const [status, setStatus] = useState<SocketStatus>(socketService.getStatus());

  useEffect(() => {
    socketService.onStatusChange(setStatus);
    return () => {
      socketService.offStatusChange(setStatus);
    };
  }, []);

  const send = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      socketService.send(type, payload);
    },
    [],
  );

  const on = useCallback(
    (type: string, listener: (payload: Record<string, unknown>) => void) => {
      socketService.on(type, listener);
    },
    [],
  );

  const off = useCallback(
    (type: string, listener: (payload: Record<string, unknown>) => void) => {
      socketService.off(type, listener);
    },
    [],
  );

  return { status, send, on, off };
}
