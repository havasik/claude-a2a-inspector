import React from 'react';
import type {ChatMessage} from '../../lib/types';
import {MessageList} from './message-list';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '../ai-elements/conversation';

interface ChatPanelProps {
  messages: ChatMessage[];
  onMessageClick: (msg: ChatMessage) => void;
}

export function ChatPanel({messages, onMessageClick}: ChatPanelProps) {
  return (
    <Conversation className="flex-1">
      {messages.length === 0 ? (
        <ConversationEmptyState
          title="No messages yet"
          description="Send a message to start chatting with the agent"
        />
      ) : (
        <ConversationContent>
          <MessageList messages={messages} onMessageClick={onMessageClick} />
        </ConversationContent>
      )}
      <ConversationScrollButton />
    </Conversation>
  );
}
