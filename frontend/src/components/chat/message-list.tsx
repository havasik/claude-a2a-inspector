import React from 'react';
import type {ChatMessage} from '../../lib/types';
import {extractArkParts} from '../../lib/ark-parser';
import {ArkMessage} from '../ark/ark-message';
import {Message, MessageContent, MessageResponse} from '../ai-elements/message';
import {Shimmer} from '../ai-elements/shimmer';
import {formatFileSize} from '../../lib/utils';
import {motion} from 'motion/react';

interface MessageListProps {
  messages: ChatMessage[];
  onMessageClick: (msg: ChatMessage) => void;
}

/**
 * Deduplicates agent messages for the same turn:
 * 1. Drops empty status-update events when artifact-updates exist
 * 2. Keeps only the last artifact-update per ARK envelope id
 *    (collapses tool-call pending/working/completed into one)
 */
function deduplicateMessages(messages: ChatMessage[]): ChatMessage[] {
  // Collect response ids that have at least one artifact-update
  const hasArtifact = new Set<string>();
  for (const msg of messages) {
    if (msg.role !== 'agent') continue;
    const responseId = (msg.raw as Record<string, unknown> | undefined)?.id as
      | string
      | undefined;
    if (responseId && msg.raw?.kind === 'artifact-update') {
      hasArtifact.add(responseId);
    }
  }

  // Find the last index for each ARK envelope id
  const lastByArkId = new Map<string, number>();
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'agent' || !msg.raw) continue;
    const arkParts = extractArkParts(msg.raw);
    for (const part of arkParts) {
      lastByArkId.set(part.ark.id, i);
    }
  }

  return messages.filter((msg, i) => {
    if (msg.role !== 'agent') return true;
    const responseId = (msg.raw as Record<string, unknown> | undefined)?.id as
      | string
      | undefined;

    // Drop empty status-updates when artifact-updates exist
    if (
      responseId &&
      msg.raw?.kind === 'status-update' &&
      !msg.content &&
      hasArtifact.has(responseId)
    ) {
      return false;
    }

    // For artifact-updates: keep only if this is the last message
    // for at least one of its ARK envelope ids
    if (msg.raw?.kind === 'artifact-update' && msg.raw) {
      const arkParts = extractArkParts(msg.raw);
      if (arkParts.length > 0) {
        return arkParts.some(part => lastByArkId.get(part.ark.id) === i);
      }
    }

    return true;
  });
}

/**
 * Groups consecutive messages from the same role into visual turns.
 */
function groupMessages(messages: ChatMessage[]): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last[0].role === msg.role) {
      last.push(msg);
    } else {
      groups.push([msg]);
    }
  }
  return groups;
}

export function MessageList({messages, onMessageClick}: MessageListProps) {
  const deduplicated = deduplicateMessages(messages);
  const groups = groupMessages(deduplicated);

  return (
    <>
      {groups.map(group => {
        const role = group[0].role;
        const from = role === 'user' ? 'user' : 'assistant';
        const groupKey = group[0].id;

        return (
          <motion.div
            key={groupKey}
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.2, ease: 'easeOut'}}
          >
            <Message from={from}>
              <MessageContent>
                {group.map(msg => (
                  <MessageBubbleContent
                    key={msg.id}
                    message={msg}
                    onClick={() => onMessageClick(msg)}
                  />
                ))}
              </MessageContent>
            </Message>
          </motion.div>
        );
      })}
    </>
  );
}

interface MessageBubbleContentProps {
  message: ChatMessage;
  onClick: () => void;
}

function MessageBubbleContent({message, onClick}: MessageBubbleContentProps) {
  const isUser = message.role === 'user';
  const arkParts = message.raw ? extractArkParts(message.raw) : [];
  const hasArkParts = arkParts.length > 0;

  return (
    <div
      className="cursor-pointer transition-opacity hover:opacity-80"
      onClick={onClick}
    >
      {hasArkParts ? (
        <div className="space-y-2">
          {arkParts.map((part, i) => (
            <ArkMessage key={`${part.ark.id}-${i}`} envelope={part} taskId={(message.raw as Record<string, unknown> | undefined)?.taskId as string | undefined} />
          ))}
          {message.content && (
            <MessageResponse>{message.content}</MessageResponse>
          )}
        </div>
      ) : message.content ? (
        <MessageResponse>{message.content}</MessageResponse>
      ) : null}

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {message.attachments.map((att, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground"
            >
              {att.mimeType.startsWith('image/') ? '\u{1F5BC}\uFE0F' : '\u{1F4CE}'} {att.name} ({formatFileSize(att.size)})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
