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
  const groups = groupMessages(messages);

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
            <ArkMessage key={`${part.ark.id}-${i}`} envelope={part} />
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
