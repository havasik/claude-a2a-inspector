import {useState, useCallback, useEffect, type RefObject} from 'react';
import type {Socket} from 'socket.io-client';
import type {DebugLog} from '@/types/a2a';

const MAX_LOGS = 500;

export interface DebugLogEntry extends DebugLog {
  timestamp: string;
}

export function useA2ADebugLog(socketRef: RefObject<Socket | null>) {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleLog = (log: DebugLog) => {
      const entry: DebugLogEntry = {
        ...log,
        timestamp: new Date().toLocaleTimeString(),
      };

      setLogs(prev => {
        const next = [...prev, entry];
        // Prune oldest entries if over limit
        if (next.length > MAX_LOGS) {
          return next.slice(next.length - MAX_LOGS);
        }
        return next;
      });
    };

    socket.on('debug_log', handleLog);

    return () => {
      socket.off('debug_log', handleLog);
    };
  }, [socketRef]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {logs, clearLogs};
}
