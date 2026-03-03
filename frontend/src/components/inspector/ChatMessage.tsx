import {useCallback, useState} from 'react';
import {CheckCircle2, AlertTriangle, Copy, Wrench, FileText, AlertCircle, Activity, ChevronDown, ChevronRight, Ban, CircleCheck, CirclePause, Clock} from 'lucide-react';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from '@/components/ai-elements/code-block';
import {cn} from '@/lib/utils';
import type {ChatMessage as ChatMessageType, Attachment, A2APart, ParsedToolCall} from '@/types/a2a';

interface ChatMessageProps {
  message: ChatMessageType;
  onClickMessage: (message: ChatMessageType) => void;
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

/** Single tool call card — collapsible */
function ToolCallCard({tc, defaultOpen}: {tc: ParsedToolCall; defaultOpen: boolean}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border bg-muted/50">
      <button
        className="flex w-full items-center gap-2 p-2 text-left"
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {isOpen ? <ChevronDown className="size-3 text-muted-foreground" /> : <ChevronRight className="size-3 text-muted-foreground" />}
        <Wrench className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{tc.toolName}</span>
      </button>
      {isOpen && (
        <div className="border-t border-border p-2">
          {tc.toolInput && (
            <CodeBlock code={tc.toolInput} language="json">
              <CodeBlockHeader>
                <CodeBlockTitle>Input</CodeBlockTitle>
                <CodeBlockCopyButton />
              </CodeBlockHeader>
            </CodeBlock>
          )}
          {tc.toolOutput && (
            <div className="mt-2">
              <MessageResponse>{tc.toolOutput}</MessageResponse>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Compact task state chip */
function TaskStateChip({state}: {state: string}) {
  const config: Record<string, {icon: typeof CircleCheck; color: string; label: string}> = {
    completed: {icon: CircleCheck, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900', label: 'Completed'},
    canceled: {icon: Ban, color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900', label: 'Canceled'},
    failed: {icon: AlertCircle, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900', label: 'Failed'},
    'input-required': {icon: CirclePause, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900', label: 'Input Required'},
    working: {icon: Clock, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900', label: 'Working'},
  };

  const c = config[state] || config.working;
  const Icon = c.icon;

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', c.color)}>
      <Icon className="size-3" />
      {c.label}
    </div>
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

  switch (parsed.type) {
    // Tool call(s) — each tool call gets its own card, last one expanded
    case 'tool-call': {
      const calls = parsed.toolCalls || (parsed.toolName ? [{toolName: parsed.toolName, toolInput: parsed.toolInput, toolOutput: parsed.toolOutput}] : []);
      const terminalStates = ['completed', 'canceled', 'failed', 'input-required'];
      const showStateChip = parsed.taskState && terminalStates.includes(parsed.taskState);

      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="space-y-1.5">
                {calls.map((tc, i) => (
                  <ToolCallCard
                    key={i}
                    tc={tc}
                    defaultOpen={i === calls.length - 1}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {showStateChip && <TaskStateChip state={parsed.taskState!} />}
                <ValidationBadge errors={parsed.validationErrors} />
              </div>
            </MessageContent>
          </Message>
        </div>
      );
    }

    // Task status — compact chip, clickable for raw JSON
    case 'task-status':
      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2">
                <TaskStateChip state={parsed.taskState || 'working'} />
                <ValidationBadge errors={parsed.validationErrors} />
              </div>
            </MessageContent>
          </Message>
        </div>
      );

    // Artifact — structured content container
    case 'artifact': {
      const artifactParts =
        parsed.event.artifact?.parts ||
        parsed.artifacts?.flatMap(a => a.parts || []) ||
        [];

      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Artifact</span>
                  <ValidationBadge errors={parsed.validationErrors} />
                </div>
                {artifactParts.map((part, i) => (
                  <div key={i}>
                    {part.text && <MessageResponse>{part.text}</MessageResponse>}
                    {part.file && <MultimediaPart part={part} />}
                    {part.data && (
                      <CodeBlock
                        code={JSON.stringify(part.data, null, 2)}
                        language="json"
                      />
                    )}
                  </div>
                ))}
              </div>
            </MessageContent>
          </Message>
        </div>
      );
    }

    // Error — red-tinted
    case 'error':
      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <AlertCircle className="size-4" />
                <span className="text-sm">{parsed.textContent}</span>
              </div>
            </MessageContent>
          </Message>
        </div>
      );

    // Agent message (normal text response) — clean, no badges
    case 'agent-message':
    default:
      return (
        <div onClick={() => onClickMessage(message)} className="cursor-pointer">
          <Message from="assistant">
            <MessageContent>
              <MessageResponse>{parsed.textContent || ''}</MessageResponse>
            </MessageContent>
            <MessageActions>
              <MessageAction tooltip="Copy" onClick={handleCopy}>
                <Copy className="size-3.5" />
              </MessageAction>
              <ValidationBadge errors={parsed.validationErrors} />
            </MessageActions>
          </Message>
        </div>
      );
  }
}
