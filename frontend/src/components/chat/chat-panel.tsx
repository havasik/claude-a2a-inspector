import React, {useEffect, useRef} from 'react';
import type {ChatMessage} from '../../lib/types';
import {MessageList} from './message-list';

interface ChatPanelProps {
  messages: ChatMessage[];
  onMessageClick: (msg: ChatMessage) => void;
}

export function ChatPanel({messages, onMessageClick}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
            Messages will appear here.
          </div>
        ) : (
          <MessageList messages={messages} onMessageClick={onMessageClick} />
        )}
      </div>
    </div>
  );
}
