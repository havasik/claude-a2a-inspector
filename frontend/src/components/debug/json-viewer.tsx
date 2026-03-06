import React from 'react';
import type {ChatMessage} from '../../lib/types';

interface JsonViewerProps {
  message: ChatMessage | null;
}

export function JsonViewer({message}: JsonViewerProps) {
  if (!message) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
        Click a message to view its raw JSON.
      </div>
    );
  }

  const json = message.raw
    ? JSON.stringify(message.raw, null, 2)
    : JSON.stringify(
        {role: message.role, content: message.content},
        null,
        2
      );

  const lines = json.split('\n');

  return (
    <div className="h-full overflow-auto p-2 font-mono text-xs">
      <div className="mb-2 text-[var(--color-text-muted)]">
        {message.role === 'user' ? 'User message' : 'Agent response'} —{' '}
        {message.raw?.kind || 'text'}
      </div>
      <pre className="p-2 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="inline-block w-8 text-right mr-3 text-[var(--color-text-muted)] select-none">
              {i + 1}
            </span>
            <span>{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
