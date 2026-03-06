import React, {useCallback, useRef, useState} from 'react';
import {useAgentConnection} from '../../providers/agent-connection-provider';
import {useSocket} from '../../providers/socket-provider';
import {useAttachments} from '../../hooks/use-attachments';
import {formatFileSize, generateMessageId} from '../../lib/utils';
import type {Attachment} from '../../lib/types';

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
}

export function ChatInput({onSendMessage}: ChatInputProps) {
  const {state} = useAgentConnection();
  const {emit} = useSocket();
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {attachments, addFiles, remove, clear} = useAttachments(
    state.inputModes
  );

  const isConnected = state.status === 'connected';

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed && attachments.length === 0) return;

    const msgId = generateMessageId();

    // Add to local message list
    onSendMessage(trimmed, attachments.length > 0 ? attachments : undefined);

    // Emit to backend
    emit('send_message', {
      message: trimmed,
      id: msgId,
      contextId: state.contextId,
      metadata: {},
      attachments: attachments.map(a => ({
        data: a.data,
        mimeType: a.mimeType,
      })),
    });

    setMessage('');
    clear();
  }, [message, attachments, state.contextId, emit, onSendMessage, clear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pt-2">
          {attachments.map((att, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
            >
              {att.mimeType.startsWith('image/') ? '🖼️' : '📎'} {att.name} (
              {formatFileSize(att.size)})
              <button
                onClick={() => remove(i)}
                className="ml-1 hover:text-[var(--color-error)]"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!isConnected}
          className="px-2 py-2 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 transition-colors"
          title="Attach files"
        >
          +
        </button>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Type a message...' : 'Connect to an agent first'}
          disabled={!isConnected}
          className="flex-1 px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input-bg)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!isConnected || (!message.trim() && attachments.length === 0)}
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-button-bg)] hover:bg-[var(--color-button-hover)] disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
