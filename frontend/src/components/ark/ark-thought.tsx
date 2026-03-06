import React, {useState} from 'react';

interface ArkThoughtProps {
  step: number;
  label?: string;
  content: string;
  status: string;
  isStreaming: boolean;
}

export function ArkThought({
  step,
  label,
  content,
  status,
  isStreaming,
}: ArkThoughtProps) {
  const [isOpen, setIsOpen] = useState(isStreaming || status !== 'done');

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg-primary)] transition-colors text-left"
      >
        <span className="text-[var(--color-text-muted)]">💭</span>
        <span className="font-medium text-[var(--color-text-primary)]">
          {label || `Step ${step}`}
        </span>
        {isStreaming && (
          <span className="text-xs text-[var(--color-warning)] animate-pulse">
            thinking...
          </span>
        )}
        {status === 'done' || status === 'complete' ? (
          <span className="text-xs text-[var(--color-success)]">✓</span>
        ) : null}
        <span className="ml-auto text-[var(--color-text-muted)]">
          {isOpen ? '▼' : '►'}
        </span>
      </button>

      {isOpen && content && (
        <div className="px-3 pb-2 border-t border-[var(--color-border)]">
          <div className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap py-2">
            {content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-[var(--color-text-primary)] animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
