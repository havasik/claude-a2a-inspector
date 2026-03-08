import React, {useCallback, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider} from './providers/theme-provider';
import {SocketProvider, useSocket} from './providers/socket-provider';
import {
  AgentConnectionProvider,
  useAgentConnection,
} from './providers/agent-connection-provider';
import {ArkStateProvider, useArkState} from './providers/ark-state-provider';
import {Header} from './components/layout/header';
import {SplitPane} from './components/layout/split-pane';
import {SessionBar} from './components/layout/session-bar';
import {ConnectionBar} from './components/connection/connection-bar';
import {ChatPanel} from './components/chat/chat-panel';
import {ChatInput} from './components/chat/chat-input';
import {DebugPanel, type DebugTab} from './components/debug/debug-panel';
import {useMessagesState, MessagesContext} from './hooks/use-messages';
import {useDebugLog} from './hooks/use-debug-log';
import {extractArkParts} from './lib/ark-parser';
import type {
  AgentResponseEvent,
  Attachment,
  ChatMessage,
  DebugLogEvent,
} from './lib/types';

function Inspector() {
  const {socket} = useSocket();
  const {state: connState, resetSession, setContextId} = useAgentConnection();
  const {processArkEnvelope, resetArkState} = useArkState();
  const messagesState = useMessagesState();
  const {messages, addUserMessage, addAgentResponse, reset: resetMessages} =
    messagesState;
  const {logs, addLog, clearLogs} = useDebugLog();
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null
  );
  const [debugTab, setDebugTab] = useState<DebugTab>('traffic');

  // Wire Socket.IO agent_response → messages + ARK state
  useEffect(() => {
    if (!socket) return;

    const handleAgentResponse = (data: AgentResponseEvent) => {
      const r = data as Record<string, unknown>;

      // Extract context ID from response if present
      if (r.contextId) {
        setContextId(r.contextId as string);
      }

      // Always accumulate ARK envelopes (chunk assembly)
      const arkParts = extractArkParts(data);
      for (const envelope of arkParts) {
        processArkEnvelope(envelope);
      }

      // Only create a ChatMessage for the first event in a stream.
      // append:true events are continuation chunks — arkState handles
      // accumulation and ArkMessage re-renders from it.
      if (!r.append) {
        addAgentResponse(data);
      }
    };

    socket.on('agent_response', handleAgentResponse);
    return () => {
      socket.off('agent_response', handleAgentResponse);
    };
  }, [socket, addAgentResponse, processArkEnvelope, setContextId]);

  // Wire Socket.IO debug_log → debug log
  useEffect(() => {
    if (!socket) return;

    const handleDebugLog = (data: DebugLogEvent) => {
      addLog(data);
    };

    socket.on('debug_log', handleDebugLog);
    return () => {
      socket.off('debug_log', handleDebugLog);
    };
  }, [socket, addLog]);

  // Handle message send
  const handleSendMessage = useCallback(
    (content: string, attachments?: Attachment[]) => {
      addUserMessage(content, attachments);
    },
    [addUserMessage]
  );

  // Handle message click → show in JSON viewer
  const handleMessageClick = useCallback(
    (msg: ChatMessage) => {
      setSelectedMessage(msg);
      setDebugTab('json');
    },
    []
  );

  // Handle new session
  const handleNewSession = useCallback(() => {
    resetMessages();
    resetArkState();
    resetSession();
    clearLogs();
    setSelectedMessage(null);
  }, [resetMessages, resetArkState, resetSession, clearLogs]);

  const isConnected = connState.status === 'connected';

  return (
    <MessagesContext.Provider value={messagesState}>
    <div className="flex flex-col h-screen">
      <Header />
      <ConnectionBar />

      {/* New Session button */}
      {isConnected && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <span className="text-sm text-muted-foreground">
            Chat
          </span>
          <button
            onClick={handleNewSession}
            className="px-3 py-1 text-xs rounded border border-border text-muted-foreground hover:bg-secondary transition-colors"
          >
            New Session
          </button>
        </div>
      )}

      {/* Main content area */}
      <SplitPane
        left={
          <div className="flex flex-col h-full">
            <ChatPanel
              messages={messages}
              onMessageClick={handleMessageClick}
            />
            <ChatInput onSendMessage={handleSendMessage} />
          </div>
        }
        right={
          <DebugPanel
            logs={logs}
            messages={messages}
            selectedMessage={selectedMessage}
            activeTab={debugTab}
            onTabChange={setDebugTab}
            onClearLogs={clearLogs}
          />
        }
      />

      <SessionBar />
    </div>
    </MessagesContext.Provider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <AgentConnectionProvider>
          <ArkStateProvider>
            <Inspector />
          </ArkStateProvider>
        </AgentConnectionProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

// Mount
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
