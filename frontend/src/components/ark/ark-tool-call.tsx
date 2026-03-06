import React, {useState} from 'react';

interface ArkToolCallProps {
  name: string;
  status: string;
  arguments_?: Record<string, unknown>;
  result?: unknown;
  error?: {code: string; message: string};
  durationMs?: number;
}

const statusConfig: Record<
  string,
  {label: string; color: string; icon: string}
> = {
  pending: {label: 'Pending', color: 'var(--color-text-muted)', icon: '⏳'},
  working: {label: 'Working', color: 'var(--color-warning)', icon: '⚙️'},
  completed: {label: 'Completed', color: 'var(--color-success)', icon: '✓'},
  failed: {label: 'Failed', color: 'var(--color-error)', icon: '✕'},
};

export function ArkToolCall({
  name,
  status,
  arguments_,
  result,
  error,
  durationMs,
}: ArkToolCallProps) {
  const [isOpen, setIsOpen] = useState(status === 'failed');
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg-primary)] transition-colors text-left"
      >
        <span>{config.icon}</span>
        <span className="font-mono font-medium text-[var(--color-text-primary)]">
          {name}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{color: config.color, borderColor: config.color, border: '1px solid'}}
        >
          {config.label}
        </span>
        {durationMs !== undefined && (
          <span className="text-xs text-[var(--color-text-muted)] ml-auto">
            {durationMs}ms
          </span>
        )}
        <span className="text-[var(--color-text-muted)]">
          {isOpen ? '▼' : '►'}
        </span>
      </button>

      {isOpen && (
        <div className="px-3 pb-2 space-y-2 border-t border-[var(--color-border)]">
          {arguments_ && Object.keys(arguments_).length > 0 && (
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">
                Arguments
              </div>
              <pre className="text-xs p-2 rounded bg-[var(--color-bg-primary)] overflow-auto max-h-32 text-[var(--color-text-secondary)]">
                {JSON.stringify(arguments_, null, 2)}
              </pre>
            </div>
          )}

          {status === 'completed' && result !== undefined && (
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">
                Result
              </div>
              <pre className="text-xs p-2 rounded bg-[var(--color-bg-primary)] overflow-auto max-h-32 text-[var(--color-success)]">
                {typeof result === 'string'
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {status === 'failed' && error && (
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">
                Error
              </div>
              <div className="text-xs p-2 rounded bg-[var(--color-kind-error)] text-[var(--color-error)]">
                <strong>{error.code}:</strong> {error.message}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
