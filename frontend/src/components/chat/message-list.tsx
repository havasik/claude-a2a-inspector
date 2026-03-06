import React from 'react';
import type {ChatMessage} from '../../lib/types';
import {extractArkParts} from '../../lib/ark-parser';
import {ArkMessage} from '../ark/ark-message';
import {formatFileSize} from '../../lib/utils';
import DOMPurify from 'dompurify';
import {marked} from 'marked';

interface MessageListProps {
  messages: ChatMessage[];
  onMessageClick: (msg: ChatMessage) => void;
}

export function MessageList({messages, onMessageClick}: MessageListProps) {
  return (
    <>
      {messages.map(msg => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onClick={() => onMessageClick(msg)}
        />
      ))}
    </>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  onClick: () => void;
}

function MessageBubble({message, onClick}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const arkParts = message.raw ? extractArkParts(message.raw) : [];
  const hasArkParts = arkParts.length > 0;
  const validationErrors = message.raw?.validation_errors || [];
  const isValid = validationErrors.length === 0;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      onClick={onClick}
    >
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 cursor-pointer transition-shadow hover:shadow-md ${
          isUser
            ? 'bg-[var(--color-button-bg)] text-white'
            : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
        }`}
      >
        {/* Validation indicator for agent messages */}
        {!isUser && (
          <div className="flex items-center gap-1 mb-1 text-xs">
            {message.raw?.kind && (
              <KindChip kind={message.raw.kind} />
            )}
            <span title={isValid ? 'A2A compliant' : validationErrors.join('\n')}>
              {isValid ? '✅' : '⚠️'}
            </span>
          </div>
        )}

        {/* ARK rendering or plain text */}
        {hasArkParts ? (
          <div className="space-y-2">
            {arkParts.map((part, i) => (
              <ArkMessage key={`${part.ark.id}-${i}`} envelope={part} />
            ))}
            {/* Also show any plain text alongside ARK parts */}
            {message.content && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    marked.parse(message.content) as string
                  ),
                }}
              />
            )}
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                marked.parse(message.content || '(empty)') as string
              ),
            }}
          />
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.attachments.map((att, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
              >
                📎 {att.name} ({formatFileSize(att.size)})
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KindChip({kind}: {kind: string}) {
  const colors: Record<string, string> = {
    task: 'bg-[var(--color-kind-task)]',
    'status-update': 'bg-[var(--color-kind-status)]',
    'artifact-update': 'bg-[var(--color-kind-artifact)]',
    message: 'bg-[var(--color-kind-message)]',
  };

  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded ${colors[kind] || 'bg-[var(--color-bg-tertiary)]'} text-[var(--color-text-secondary)]`}
    >
      {kind}
    </span>
  );
}
