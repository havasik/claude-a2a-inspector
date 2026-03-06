import React, {useEffect, useRef} from 'react';
import type {DebugLogEvent} from '../../lib/types';

interface TrafficLogProps {
  logs: DebugLogEvent[];
}

const typeColors: Record<string, string> = {
  request: 'text-[var(--color-button-bg)]',
  response: 'text-[var(--color-success)]',
  error: 'text-[var(--color-error)]',
  validation_error: 'text-[var(--color-warning)]',
};

export function TrafficLog({logs}: TrafficLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
        Debug logs will appear here.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto p-2 font-mono text-xs"
    >
      {logs.map((log, i) => (
        <div key={i} className="mb-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`font-bold uppercase ${typeColors[log.type] || ''}`}>
              [{log.type}]
            </span>
            {log.id && (
              <span className="text-[var(--color-text-muted)]">{log.id}</span>
            )}
          </div>
          <pre className="p-1.5 rounded bg-[var(--color-bg-tertiary)] overflow-auto max-h-32 text-[var(--color-text-secondary)] whitespace-pre-wrap break-all">
            {formatJson(log.data)}
          </pre>
        </div>
      ))}
    </div>
  );
}

function formatJson(data: Record<string, unknown>): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
