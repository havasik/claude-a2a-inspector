import React, {useCallback, useState} from 'react';
import {useAgentConnection} from '../../providers/agent-connection-provider';
import {AuthPanel} from './auth-panel';
import {AgentCardDisplay} from './agent-card-display';

export function ConnectionBar() {
  const {state, connect, disconnect} = useAgentConnection();
  const [url, setUrl] = useState('');
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});

  const handleConnect = useCallback(() => {
    if (state.status === 'connected') {
      disconnect();
    } else {
      connect(url, authHeaders);
    }
  }, [state.status, url, authHeaders, connect, disconnect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && state.status !== 'connected') {
        handleConnect();
      }
    },
    [handleConnect, state.status]
  );

  const isLoading =
    state.status === 'fetching-card' || state.status === 'initializing';
  const isConnected = state.status === 'connected';

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="flex items-center gap-2 px-4 py-3">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Agent Card URL"
          disabled={isConnected}
          className="flex-1 px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input-bg)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
        />
        <button
          onClick={handleConnect}
          disabled={isLoading || (!url && !isConnected)}
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-button-bg)] hover:bg-[var(--color-button-hover)] disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      <AuthPanel onHeadersChange={setAuthHeaders} disabled={isConnected} />

      {state.error && (
        <div className="px-4 py-2 text-sm text-[var(--color-error)] bg-[var(--color-kind-error)]">
          {state.error}
        </div>
      )}

      {state.card && <AgentCardDisplay />}
    </div>
  );
}
