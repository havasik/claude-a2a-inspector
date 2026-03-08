import React from 'react';
import {useAgentConnection} from '../../providers/agent-connection-provider';

export function SessionBar() {
  const {state} = useAgentConnection();

  if (state.status !== 'connected') return null;

  return (
    <div className="flex items-center gap-4 px-4 py-2 text-xs border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
      <span>
        <strong>Transport:</strong> {state.transport || 'N/A'}
      </span>
      <span>
        <strong>Context:</strong>{' '}
        <code className="bg-[var(--color-bg-tertiary)] px-1 rounded">
          {state.contextId || 'none'}
        </code>
      </span>
      <span>
        <strong>Input:</strong> {state.inputModes.join(', ') || 'N/A'}
      </span>
      <span>
        <strong>Output:</strong> {state.outputModes.join(', ') || 'N/A'}
      </span>
    </div>
  );
}
