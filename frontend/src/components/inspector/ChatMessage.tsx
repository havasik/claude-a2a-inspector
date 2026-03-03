import {useCallback} from 'react';
import {CheckCircle2, AlertTriangle, Copy, Wrench, Brain, FileText, AlertCircle, Activity} from 'lucide-react';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from '@/components/ai-elements/code-block';
import {cn} from '@/lib/utils';
import type {ChatMessage as ChatMessageType, Attachment, A2APart} from '@/types/a2a';

interface ChatMessageProps {
  message: ChatMessageType;
  onClickMessage: (message: ChatMessageType) => void;
}

function KindChip({kind, className}: {kind: string; className?: string}) {
  const colorMap: Record<string, string> = {
    'task': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    'status-update': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
    'artifact-update': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    'message': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    'error': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        colorMap[kind] || 'bg-muted text-muted-foreground border-border',
        className,
      )}
    >
      {kind}
    </span>
  );
}

function ValidationBadge({errors}: {errors: string[]}) {
  if (errors.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400" title="Message is compliant">
        <CheckCircle2 className="size-3" />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400"
      title={errors.join('\n')}
    >
      <AlertTriangle className="size-3" />
    </span>
  );
}

function AttachmentBadges({attachments}: {attachments: Attachment[]}) {
  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('video/')) return '🎬';
    return '📎';
  };

  return (
    <div className="flex flex-wrap gap-1">
      {attachments.map(a => (
        <span
          key={a.id}
          className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-xs"
        >
          {getIcon(a.mimeType)} {a.name}
        </span>
      ))}
    </div>
  );
}

function MultimediaPart({part}: {part: A2APart}) {
  if (!part.file) return null;
  const {mimeType} = part.file;
  if (!mimeType) return null;

  let src: string;
  if ('bytes' in part.file && part.file.bytes) {
    src = `data:${mimeType};base64,${part.file.bytes}`;
  } else if ('uri' in part.file && part.file.uri) {
    src = part.file.uri;
  } else {
    return null;
  }

  if (mimeType.startsWith('image/')) {
    return <img src={src} alt="Attachment" className="max-h-72 max-w-sm rounded-lg" />;
  }
  if (mimeType.startsWith('audio/')) {
    return <audio controls src={src} className="max-w-sm" />;
  }
  if (mimeType.startsWith('video/')) {
    return <video controls src={src} className="max-h-72 max-w-sm rounded-lg" />;
  }
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
      📎 Download file ({mimeType})
    </a>
  );
}

export function ChatMessageComponent({message, onClickMessage}: ChatMessageProps) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
  }, [message.content]);

  // User message
  if (message.role === 'user') {
    return (
      <div onClick={() => onClickMessage(message)} className="cursor-pointer">
        <Message from="user">
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentBadges attachments={message.attachments} />
          )}
          <MessageContent>
            <p>{message.content}</p>
          </MessageContent>
        </Message>
      </div>
    );
  }

  // Agent message — render based on parsed event type
  const parsed = message.parsedEvent;
  if (!parsed) {
    return (
      <div onClick={() => onClickMessage(message)} className="cursor-pointer">
        <Message from="assistant">
          <MessageContent>
            <p>{message.content}</p>
          </MessageContent>
        </Message>
      </div>
    );
  }

  const eventKind = parsed.event.kind;

  switch (parsed.type) {
    case 'tool-call':
      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <KindChip kind={eventKind} />
                  <ValidationBadge errors={parsed.validationErrors} />
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Wrench className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{parsed.toolName}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        parsed.isFinal
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                      )}
                    >
                      {parsed.isFinal ? 'completed' : parsed.taskState || 'running'}
                    </span>
                  </div>
                  {parsed.toolInput && (
                    <CodeBlock code={parsed.toolInput} language="json">
                      <CodeBlockHeader>
                        <CodeBlockTitle>Input</CodeBlockTitle>
                        <CodeBlockCopyButton />
                      </CodeBlockHeader>
                    </CodeBlock>
                  )}
                  {parsed.toolOutput && (
                    <div className="mt-2">
                      <MessageResponse>{parsed.toolOutput}</MessageResponse>
                    </div>
                  )}
                </div>
              </div>
            </MessageContent>
          </Message>
        </div>
      );

    case 'reasoning':
      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2">
                <KindChip kind={eventKind} />
                <ValidationBadge errors={parsed.validationErrors} />
              </div>
              <Reasoning isStreaming={!parsed.isFinal} defaultOpen={!parsed.isFinal}>
                <ReasoningTrigger />
                <ReasoningContent>{parsed.textContent || ''}</ReasoningContent>
              </Reasoning>
            </MessageContent>
          </Message>
        </div>
      );

    case 'task-status':
      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2">
                <KindChip kind={eventKind} />
                <ValidationBadge errors={parsed.validationErrors} />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                <Activity className="size-4 text-muted-foreground" />
                <span className="text-sm">
                  Task status:{' '}
                  <span
                    className={cn(
                      'font-medium',
                      parsed.taskState === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : parsed.taskState === 'failed'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-600 dark:text-blue-400',
                    )}
                  >
                    {parsed.taskState}
                  </span>
                </span>
              </div>
            </MessageContent>
          </Message>
        </div>
      );

    case 'artifact': {
      // Render artifact parts (text, files, data)
      const artifactParts =
        parsed.event.artifact?.parts ||
        parsed.artifacts?.flatMap(a => a.parts || []) ||
        [];

      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2">
                <KindChip kind={eventKind} />
                <ValidationBadge errors={parsed.validationErrors} />
              </div>
              <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Artifact</span>
                </div>
                {artifactParts.map((part, i) => (
                  <div key={i}>
                    {part.text && <MessageResponse>{part.text}</MessageResponse>}
                    {part.file && <MultimediaPart part={part} />}
                    {part.data && (
                      <CodeBlock
                        code={JSON.stringify(part.data, null, 2)}
                        language="json"
                      >
                        </CodeBlock>
                    )}
                  </div>
                ))}
              </div>
            </MessageContent>
          </Message>
        </div>
      );
    }

    case 'error':
      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2">
                <KindChip kind="error" />
                <ValidationBadge errors={parsed.validationErrors} />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <AlertCircle className="size-4" />
                <span className="text-sm">{parsed.textContent}</span>
              </div>
            </MessageContent>
          </Message>
        </div>
      );

    case 'agent-message':
    default:
      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2">
                <KindChip kind={eventKind} />
                <ValidationBadge errors={parsed.validationErrors} />
              </div>
              <MessageResponse>{parsed.textContent || ''}</MessageResponse>
            </MessageContent>
            <MessageActions>
              <MessageAction tooltip="Copy" onClick={handleCopy}>
                <Copy className="size-3.5" />
              </MessageAction>
            </MessageActions>
          </Message>
        </div>
      );
  }
}
