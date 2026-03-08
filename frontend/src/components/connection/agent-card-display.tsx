import React, {useState} from 'react';
import {useAgentConnection} from '../../providers/agent-connection-provider';

export function AgentCardDisplay() {
  const {state} = useAgentConnection();
  const [isOpen, setIsOpen] = useState(true);

  if (!state.card) return null;

  const card = state.card;
  const hasErrors = state.cardValidationErrors.length > 0;

  return (
    <div className="border-t border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
      >
        <span className="mr-1">{isOpen ? '▼' : '►'}</span>
        Agent Card
        {hasErrors && (
          <span className="ml-2 text-[var(--color-warning)]">
            ({state.cardValidationErrors.length} warning
            {state.cardValidationErrors.length > 1 ? 's' : ''})
          </span>
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-3">
          {hasErrors && (
            <div className="mb-2 p-2 rounded bg-[var(--color-kind-error)] text-sm text-[var(--color-error)]">
              {state.cardValidationErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                {card.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                v{card.version}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {card.description}
            </p>

            {card.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.skills.map(skill => (
                  <span
                    key={skill.id || skill.name}
                    className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-kind-task)] text-[var(--color-text-primary)]"
                    title={skill.description}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
                Raw JSON
              </summary>
              <pre className="mt-1 p-2 rounded bg-[var(--color-bg-tertiary)] overflow-auto max-h-48 text-[var(--color-text-secondary)]">
                {JSON.stringify(card, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
