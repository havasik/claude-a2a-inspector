import {useState, useCallback, useEffect, type RefObject} from 'react';
import type {Socket} from 'socket.io-client';
import type {
  AgentResponseEvent,
  ChatMessage,
  Attachment,
  ParsedA2AEvent,
} from '@/types/a2a';
import {parseA2AEvent} from '@/lib/parseA2AEvent';
import DOMPurify from 'dompurify';

export function useA2AChat(socketRef: RefObject<Socket | null>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contextId, setContextId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rawEventStore, setRawEventStore] = useState<
    Record<string, AgentResponseEvent>
  >({});

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleResponse = (event: AgentResponseEvent) => {
      setIsLoading(false);

      const displayId = `display-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Store raw event
      setRawEventStore(prev => ({...prev, [displayId]: event}));

      // Update context ID
      if (event.contextId) {
        setContextId(event.contextId);
      }

      const parsed = parseA2AEvent(event, displayId);

      const msg: ChatMessage = {
        id: displayId,
        role: 'agent',
        content: parsed.textContent || '',
        rawEvent: event,
        parsedEvent: parsed,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, msg]);
    };

    socket.on('agent_response', handleResponse);

    return () => {
      socket.off('agent_response', handleResponse);
    };
  }, [socketRef]);

  const sendMessage = useCallback(
    (
      text: string,
      attachments: Attachment[],
      metadata: Record<string, string>,
    ) => {
      const socket = socketRef.current;
      if (!socket) return;

      const sanitizedMessage = DOMPurify.sanitize(text);
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Add user message to chat
      const userMsg: ChatMessage = {
        id: messageId,
        role: 'user',
        content: sanitizedMessage,
        attachments: attachments.length > 0 ? [...attachments] : undefined,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      const attachmentsToSend = attachments.map(a => ({
        data: a.data,
        mimeType: a.mimeType,
      }));

      socket.emit('send_message', {
        message: sanitizedMessage,
        id: messageId,
        contextId,
        metadata,
        attachments: attachmentsToSend,
      });
    },
    [socketRef, contextId],
  );

  const resetSession = useCallback(() => {
    setContextId(null);
    setMessages([]);
    setRawEventStore({});
    setIsLoading(false);
  }, []);

  return {
    messages,
    contextId,
    isLoading,
    rawEventStore,
    sendMessage,
    resetSession,
  };
}
