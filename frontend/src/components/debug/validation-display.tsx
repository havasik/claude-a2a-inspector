import React from 'react';
import type {ChatMessage} from '../../lib/types';

interface ValidationDisplayProps {
  messages: ChatMessage[];
}

export function ValidationDisplay({messages}: ValidationDisplayProps) {
  const agentMessages = messages.filter(m => m.role === 'agent' && m.raw);

  if (agentMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
        Agent message validation will appear here.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2 space-y-2">
      {agentMessages.map(msg => {
        const errors = msg.raw?.validation_errors || [];
        const isValid = errors.length === 0;

        return (
          <div
            key={msg.id}
            className="rounded border border-[var(--color-border)] p-2"
          >
            <div className="flex items-center gap-2 text-sm">
              <span>{isValid ? '✅' : '⚠️'}</span>
              <span className="text-[var(--color-text-primary)]">
                {msg.raw?.kind || 'message'}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {isValid ? 'A2A compliant' : `${errors.length} error${errors.length > 1 ? 's' : ''}`}
              </span>
            </div>
            {!isValid && (
              <div className="mt-1 space-y-0.5">
                {errors.map((err, i) => (
                  <div
                    key={i}
                    className="text-xs text-[var(--color-error)] pl-6"
                  >
                    {err}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
