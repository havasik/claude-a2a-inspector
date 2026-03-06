import React from 'react';
import type {ArkEnvelope} from '../../lib/types';
import {isKnownArkKind} from '../../lib/ark-parser';
import {useArkState} from '../../providers/ark-state-provider';
import {ArkToolCall} from './ark-tool-call';
import {ArkThought} from './ark-thought';
import {ArkTextStream} from './ark-text-stream';
import {ArkInputRequest} from './ark-input-request';

interface ArkMessageProps {
  envelope: ArkEnvelope;
}

export function ArkMessage({envelope}: ArkMessageProps) {
  const {arkState} = useArkState();
  const {kind, id} = envelope.ark;
  const accumulated = arkState.events.get(id);

  if (!isKnownArkKind(kind)) {
    // Unknown kind — render raw JSON
    return (
      <details className="text-xs">
        <summary className="cursor-pointer text-[var(--color-text-muted)]">
          Unknown ARK kind: {kind}
        </summary>
        <pre className="mt-1 p-2 rounded bg-[var(--color-bg-tertiary)] overflow-auto text-[var(--color-text-secondary)]">
          {JSON.stringify(envelope, null, 2)}
        </pre>
      </details>
    );
  }

  const payload = accumulated?.payload || envelope.ark.payload;
  const status = accumulated?.status || (payload.status as string);

  switch (kind) {
    case 'tool-call':
      return (
        <ArkToolCall
          name={payload.name as string}
          status={status || 'pending'}
          arguments_={payload.arguments as Record<string, unknown> | undefined}
          result={payload.result}
          error={payload.error as {code: string; message: string} | undefined}
          durationMs={payload.durationMs as number | undefined}
        />
      );

    case 'thought':
      return (
        <ArkThought
          step={payload.step as number}
          label={payload.label as string | undefined}
          content={accumulated?.assembled || (payload.content as string) || ''}
          status={status || 'complete'}
          isStreaming={status === 'streaming'}
        />
      );

    case 'text':
      return null; // Plain text is handled by MessageBubble via extractPlainText

    case 'text-stream':
      return (
        <ArkTextStream
          assembled={accumulated?.assembled || ''}
          isDone={status === 'done'}
        />
      );

    case 'input-request':
      return <ArkInputRequest payload={payload} />;

    case 'input-response':
      return (
        <div className="text-xs text-[var(--color-text-muted)] italic">
          Input response sent (type: {payload.type as string})
        </div>
      );

    default:
      return null;
  }
}
