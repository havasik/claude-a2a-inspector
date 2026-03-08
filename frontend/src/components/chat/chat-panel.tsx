import React, {useCallback, useEffect, useRef} from 'react';
import type {ChatMessage} from '../../lib/types';
import {MessageList} from './message-list';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from '../ai-elements/conversation';

interface ChatPanelProps {
  messages: ChatMessage[];
  onMessageClick: (msg: ChatMessage) => void;
}

export function ChatPanel({messages, onMessageClick}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Track whether user is scrolled to bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 50;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Auto-scroll to bottom when messages change (if user is at bottom)
  useEffect(() => {
    const el = scrollRef.current;
    if (el && isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative flex-1 min-h-0 overflow-y-auto"
    >
      {messages.length === 0 ? (
        <ConversationEmptyState
          title="No messages yet"
          description="Send a message to start chatting with the agent"
        />
      ) : (
        <div className="flex flex-col gap-8 p-4">
          <MessageList messages={messages} onMessageClick={onMessageClick} />
        </div>
      )}
    </div>
  );
}
