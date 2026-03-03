import {useCallback} from 'react';
import {useTheme} from '@/hooks/useTheme';
import {useA2ASocket} from '@/hooks/useA2ASocket';
import {useA2AConnection} from '@/hooks/useA2AConnection';
import {useA2AChat} from '@/hooks/useA2AChat';
import {useA2ADebugLog} from '@/hooks/useA2ADebugLog';
import {ThemeToggle} from '@/components/inspector/ThemeToggle';
import {ConnectionPanel} from '@/components/inspector/ConnectionPanel';
import {AgentCardPanel} from '@/components/inspector/AgentCardPanel';
import {ChatPanel} from '@/components/inspector/ChatPanel';
import {DebugConsole} from '@/components/inspector/DebugConsole';
import type {Attachment} from '@/types/a2a';

export function App() {
  const {isDark, toggleTheme} = useTheme();
  const socketRef = useA2ASocket();

  const connection = useA2AConnection(socketRef);
  const chat = useA2AChat(socketRef);
  const debugLog = useA2ADebugLog(socketRef);

  const handleConnect = useCallback(
    (...args: Parameters<typeof connection.connect>) => {
      chat.resetSession();
      debugLog.clearLogs();
      connection.connect(...args);
    },
    [connection, chat, debugLog],
  );

  const handleSendMessage = useCallback(
    (text: string, attachments: Attachment[], metadata: Record<string, string>) => {
      chat.sendMessage(text, attachments, metadata);
    },
    [chat],
  );

  const handleResetSession = useCallback(() => {
    chat.resetSession();
  }, [chat]);

  return (
    <div className="min-h-screen bg-background pb-24 transition-colors">
      <div className="mx-auto max-w-4xl p-5">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-2xl font-bold">A2A Inspector</h1>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>

          {/* Connection Panel */}
          <ConnectionPanel
            isConnecting={connection.isConnecting}
            connectionError={connection.connectionError}
            onConnect={handleConnect}
          />

          {/* Agent Card */}
          <AgentCardPanel
            agentCard={connection.agentCard}
            validationErrors={connection.cardValidationErrors}
            isConnecting={connection.isConnecting}
          />

          {/* Chat */}
          <ChatPanel
            messages={chat.messages}
            isConnected={connection.isConnected}
            isLoading={chat.isLoading}
            contextId={chat.contextId}
            transport={connection.transport}
            inputModes={connection.inputModes}
            outputModes={connection.outputModes}
            onSendMessage={handleSendMessage}
            onResetSession={handleResetSession}
          />
        </div>
      </div>

      {/* Debug Console */}
      <DebugConsole logs={debugLog.logs} onClear={debugLog.clearLogs} />
    </div>
  );
}
