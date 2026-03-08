import React, {useCallback, useRef, useState} from 'react';
import {useAgentConnection} from '../../providers/agent-connection-provider';
import {useSocket} from '../../providers/socket-provider';
import {useAttachments} from '../../hooks/use-attachments';
import {formatFileSize, generateMessageId} from '../../lib/utils';
import type {Attachment} from '../../lib/types';
import {Button} from '../ui/button';
import {CornerDownLeftIcon, PaperclipIcon, XIcon} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
}

export function ChatInput({onSendMessage}: ChatInputProps) {
  const {state} = useAgentConnection();
  const {emit} = useSocket();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {attachments, addFiles, remove, clear} = useAttachments(
    state.inputModes
  );

  const isConnected = state.status === 'connected';

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed && attachments.length === 0) return;

    const msgId = generateMessageId();

    onSendMessage(trimmed, attachments.length > 0 ? attachments : undefined);

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

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      // Auto-resize textarea
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    },
    []
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
    <div className="border-t border-border bg-card p-3">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((att, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground"
            >
              {att.name}
              <button
                onClick={() => remove(i)}
                className="ml-0.5 hover:text-destructive"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={!isConnected}
          variant="ghost"
          size="icon-sm"
          className="shrink-0 mb-0.5"
          type="button"
        >
          <PaperclipIcon className="size-4" />
        </Button>

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? 'Type a message...'
                : 'Connect to an agent first'
            }
            disabled={!isConnected}
            rows={1}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            onClick={handleSend}
            disabled={
              !isConnected || (!message.trim() && attachments.length === 0)
            }
            variant="ghost"
            size="icon-sm"
            className="absolute bottom-1.5 right-1.5"
            type="button"
          >
            <CornerDownLeftIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
