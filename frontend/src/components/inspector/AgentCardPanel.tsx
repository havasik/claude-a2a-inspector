import {useState} from 'react';
import {ChevronDown, ChevronRight, CheckCircle2, AlertTriangle} from 'lucide-react';
import {CodeBlock, CodeBlockCopyButton, CodeBlockHeader, CodeBlockTitle} from '@/components/ai-elements/code-block';

interface AgentCardPanelProps {
  agentCard: Record<string, unknown> | null;
  validationErrors: string[];
  isConnecting: boolean;
}

export function AgentCardPanel({
  agentCard,
  validationErrors,
  isConnecting,
}: AgentCardPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-t border-border pt-4">
      <button
        className="flex w-full items-center gap-2 text-left text-base font-semibold"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        Agent Card
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Validation Status */}
          {isConnecting && (
            <p className="text-sm text-muted-foreground">
              Fetching Agent Card...
            </p>
          )}

          {!isConnecting && !agentCard && (
            <p className="text-center text-sm text-muted-foreground">
              Connect to an agent to see its card.
            </p>
          )}

          {agentCard && validationErrors.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              Agent card is valid.
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                <AlertTriangle className="size-4" />
                Validation Errors
              </div>
              <ul className="list-inside list-disc space-y-1 text-xs text-orange-600 dark:text-orange-400">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Agent Card JSON */}
          {agentCard && (
            <CodeBlock code={JSON.stringify(agentCard, null, 2)} language="json">
              <CodeBlockHeader>
                <CodeBlockTitle>agent-card.json</CodeBlockTitle>
                <CodeBlockCopyButton />
              </CodeBlockHeader>
            </CodeBlock>
          )}
        </div>
      )}
    </div>
  );
}
