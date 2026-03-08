import {useCallback, useState} from 'react';
import type {DebugLogEvent} from '../lib/types';

const MAX_LOGS = 500;

export function useDebugLog() {
  const [logs, setLogs] = useState<DebugLogEvent[]>([]);

  const addLog = useCallback((log: DebugLogEvent) => {
    setLogs(prev => {
      const next = [...prev, log];
      if (next.length > MAX_LOGS) {
        return next.slice(next.length - MAX_LOGS);
      }
      return next;
    });
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return {logs, addLog, clearLogs};
}
