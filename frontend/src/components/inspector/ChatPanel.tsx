import {useState, useCallback} from 'react';
import {MessageSquare, RotateCcw} from 'lucide-react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {Shimmer} from '@/components/ai-elements/shimmer';
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from '@/components/ai-elements/code-block';
import {Button} from '@/components/ui/button';
import {ChatMessageComponent} from './ChatMessage';
import {ChatInput} from './ChatInput';
import {SessionDetails} from './SessionDetails';
import type {ChatMessage, Attachment} from '@/types/a2a';

interface ChatPanelProps {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  contextId: string | null;
  transport: string | null;
  inputModes: string[];
  outputModes: string[];
  onSendMessage: (
    text: string,
    attachments: Attachment[],
    metadata: Record<string, string>,
  ) => void;
  onResetSession: () => void;
}

export function ChatPanel({
  messages,
  isConnected,
  isLoading,
  contextId,
  transport,
  inputModes,
  outputModes,
  onSendMessage,
  onResetSession,
}: ChatPanelProps) {
  const [modalMessage, setModalMessage] = useState<ChatMessage | null>(null);

  const handleClickMessage = useCallback((msg: ChatMessage) => {
    setModalMessage(msg);
  }, []);

  return (
    <div className="border-t border-border pt-4">
      {/* Chat Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Chat</h2>
        <Button
          variant="outline"
          size="sm"
          disabled={!isConnected || !contextId}
          onClick={onResetSession}
        >
          <RotateCcw className="mr-1 size-3" />
          New Session
        </Button>
      </div>

      <p className="mb-3 text-center text-xs text-muted-foreground">
        Messages from the agent are marked with{' '}
        <span className="text-green-600">✓</span> (compliant) or{' '}
        <span className="text-orange-600">⚠</span> (non-compliant). Click any
        message to view the raw JSON.
      </p>

      {/* Session Details */}
      <div className="mb-3">
        <SessionDetails
          transport={transport}
          inputModes={inputModes}
          outputModes={outputModes}
          contextId={contextId}
        />
      </div>

      {/* Chat Messages */}
      <div className="mb-3 h-[400px] rounded-md border border-border bg-muted/30">
        <Conversation className="h-full">
          <ConversationContent className="gap-4 p-4">
            {messages.length === 0 ? (
              <ConversationEmptyState
                title={isConnected ? 'No messages yet' : 'Not connected'}
                description={
                  isConnected
                    ? 'Send a message to start a new session.'
                    : 'Connect to an agent to start chatting.'
                }
                icon={<MessageSquare className="size-8" />}
              />
            ) : (
              <>
                {messages.map(msg => (
                  <ChatMessageComponent
                    key={msg.id}
                    message={msg}
                    onClickMessage={handleClickMessage}
                    onSendResponse={text => onSendMessage(text, [], {})}
                  />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shimmer duration={1.5}>Agent is thinking...</Shimmer>
                  </div>
                )}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Chat Input */}
      <ChatInput
        isConnected={isConnected}
        inputModes={inputModes}
        onSendMessage={onSendMessage}
      />

      {/* Raw JSON Modal */}
      {modalMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setModalMessage(null)}
        >
          <div
            className="flex max-h-[90vh] w-[90%] max-w-3xl flex-col overflow-hidden rounded-lg bg-background p-4 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Raw JSON</h3>
              <button
                className="text-2xl text-muted-foreground hover:text-foreground"
                onClick={() => setModalMessage(null)}
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeBlock
                code={JSON.stringify(
                  modalMessage.rawEvent || {
                    role: 'user',
                    content: modalMessage.content,
                    attachments: modalMessage.attachments?.map(a => ({
                      name: a.name,
                      mimeType: a.mimeType,
                      size: a.size,
                    })),
                  },
                  null,
                  2,
                )}
                language="json"
              >
                <CodeBlockHeader>
                  <CodeBlockTitle>
                    {modalMessage.role === 'user' ? 'User Message' : 'Agent Response'}
                  </CodeBlockTitle>
                  <CodeBlockCopyButton />
                </CodeBlockHeader>
              </CodeBlock>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
