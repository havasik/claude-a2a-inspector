import React from 'react';
import type {ArkEnvelope} from '../../lib/types';
import {isKnownArkKind} from '../../lib/ark-parser';
import {useArkState} from '../../providers/ark-state-provider';
import {MessageResponse} from '../ai-elements/message';
import {Shimmer} from '../ai-elements/shimmer';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '../ai-elements/tool';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '../ai-elements/reasoning';
import {ArkInputRequest} from './ark-input-request';

interface ArkMessageProps {
  envelope: ArkEnvelope;
  taskId?: string;
}

/**
 * Maps ARK tool-call statuses to AI SDK ToolUIPart states.
 */
function mapToolStatus(
  arkStatus: string
): 'input-streaming' | 'input-available' | 'output-available' | 'output-error' {
  switch (arkStatus) {
    case 'pending':
      return 'input-streaming';
    case 'working':
      return 'input-available';
    case 'failed':
      return 'output-error';
    case 'completed':
    default:
      return 'output-available';
  }
}

export function ArkMessage({envelope, taskId}: ArkMessageProps) {
  const {arkState} = useArkState();
  const {kind, id} = envelope.ark;
  const accumulated = arkState.events.get(id);

  if (!isKnownArkKind(kind)) {
    return (
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">
          Unknown ARK kind: {kind}
        </summary>
        <pre className="mt-1 p-2 rounded bg-secondary overflow-auto text-muted-foreground">
          {JSON.stringify(envelope, null, 2)}
        </pre>
      </details>
    );
  }

  const payload = accumulated?.payload || envelope.ark.payload;
  const status = accumulated?.status || (payload.status as string);

  switch (kind) {
    case 'tool-call': {
      const toolState = mapToolStatus(status || 'pending');
      const name = payload.name as string;
      const args = payload.arguments as Record<string, unknown> | undefined;
      const result = payload.result;
      const error = payload.error as
        | {code: string; message: string}
        | undefined;

      return (
        <Tool defaultOpen={toolState === 'output-error'}>
          <ToolHeader
            type="dynamic-tool"
            toolName={name}
            state={toolState}
            title={name}
          />
          <ToolContent>
            {args && <ToolInput input={args} />}
            <ToolOutput
              output={result}
              errorText={error?.message}
            />
          </ToolContent>
        </Tool>
      );
    }

    case 'thought': {
      const content =
        accumulated?.assembled || (payload.content as string) || '';
      const isStreaming = status === 'streaming';

      return (
        <Reasoning isStreaming={isStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{content}</ReasoningContent>
        </Reasoning>
      );
    }

    case 'text':
      return null;

    case 'text-stream': {
      const assembled = accumulated?.assembled || '';
      const isDone = status === 'done';
      if (!assembled && !isDone) {
        return <Shimmer>Generating response...</Shimmer>;
      }

      return <MessageResponse>{assembled}</MessageResponse>;
    }

    case 'input-request':
      return <ArkInputRequest envelope={envelope} taskId={taskId} />;

    case 'input-response':
      return (
        <div className="text-xs text-muted-foreground italic">
          Input response sent (type: {payload.type as string})
        </div>
      );

    default:
      return null;
  }
}
