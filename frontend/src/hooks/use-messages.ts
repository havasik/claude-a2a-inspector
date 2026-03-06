import {useCallback, useState} from 'react';
import type {AgentResponseEvent, Attachment, ChatMessage} from '../lib/types';
import {extractPlainText} from '../lib/ark-parser';
import {generateMessageId} from '../lib/utils';

export function useMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addUserMessage = useCallback(
    (content: string, attachments?: Attachment[]) => {
      const msg: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content,
        timestamp: Date.now(),
        attachments,
      };
      setMessages(prev => [...prev, msg]);
      return msg;
    },
    []
  );

  const addAgentResponse = useCallback((response: AgentResponseEvent) => {
    const text = extractPlainText(response);
    const msg: ChatMessage = {
      id: generateMessageId(),
      role: 'agent',
      content: text,
      timestamp: Date.now(),
      raw: response,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  const reset = useCallback(() => setMessages([]), []);

  return {messages, addUserMessage, addAgentResponse, reset};
}
