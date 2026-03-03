import {useState, useCallback, useEffect, useRef, type RefObject} from 'react';
import type {Socket} from 'socket.io-client';
import type {
  AgentResponseEvent,
  ChatMessage,
  Attachment,
} from '@/types/a2a';
import {parseA2AEvent} from '@/lib/parseA2AEvent';
import DOMPurify from 'dompurify';

let displayIdCounter = 0;

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
      // Update context ID
      if (event.contextId) {
        setContextId(event.contextId);
      }

      const displayId = `display-${++displayIdCounter}`;
      const parsed = parseA2AEvent(event, displayId);

      // Skip empty status-updates (just "working" heartbeats).
      if (parsed.type === 'status-update-empty') {
        return;
      }

      // For final events, stop loading
      if (parsed.isFinal) {
        setIsLoading(false);
      }

      // Store raw event keyed by display id
      setRawEventStore(prev => ({...prev, [displayId]: event}));

      const msg: ChatMessage = {
        id: displayId,
        role: 'agent',
        content: parsed.textContent || '',
        rawEvent: event,
        parsedEvent: parsed,
        timestamp: Date.now(),
      };

      setMessages(prev => {
        // For agent-message type: if an existing message from the same event.id
        // has the same text, replace it (dedup final/non-final with identical content).
        // This prevents the "same response shown twice" problem.
        if (parsed.type === 'agent-message') {
          const existingIdx = prev.findIndex(
            m =>
              m.role === 'agent' &&
              m.parsedEvent?.type === 'agent-message' &&
              m.rawEvent?.id === event.id &&
              m.content === msg.content,
          );

          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = msg;
            return updated;
          }
        }

        // For task-status: replace existing task-status for the same event id
        // (state transitions update in place: working → completed → canceled)
        if (parsed.type === 'task-status') {
          const existingIdx = prev.findIndex(
            m =>
              m.role === 'agent' &&
              m.parsedEvent?.type === 'task-status' &&
              m.rawEvent?.id === event.id,
          );

          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = msg;
            return updated;
          }
        }

        // Everything else (tool-call, artifact, error, different text): append
        return [...prev, msg];
      });
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
