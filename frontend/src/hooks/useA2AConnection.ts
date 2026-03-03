import {useState, useCallback, useEffect, type RefObject} from 'react';
import type {Socket} from 'socket.io-client';
import type {ClientInitializedData} from '@/types/a2a';

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'api-key';
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
}

export interface HeaderPair {
  id: string;
  key: string;
  value: string;
}

export function useA2AConnection(socketRef: RefObject<Socket | null>) {
  const [agentCard, setAgentCard] = useState<Record<string, unknown> | null>(
    null,
  );
  const [cardValidationErrors, setCardValidationErrors] = useState<string[]>(
    [],
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [transport, setTransport] = useState<string | null>(null);
  const [inputModes, setInputModes] = useState<string[]>(['text/plain']);
  const [outputModes, setOutputModes] = useState<string[]>(['text/plain']);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleInitialized = (data: ClientInitializedData) => {
      setIsConnecting(false);
      if (data.status === 'success') {
        setIsConnected(true);
        setConnectionError(null);
        setTransport(data.transport || null);
        setInputModes(data.inputModes || ['text/plain']);
        setOutputModes(data.outputModes || ['text/plain']);
      } else {
        setIsConnected(false);
        setConnectionError(
          data.message || 'Failed to initialize client session.',
        );
      }
    };

    socket.on('client_initialized', handleInitialized);

    return () => {
      socket.off('client_initialized', handleInitialized);
    };
  }, [socketRef]);

  const buildAuthHeaders = useCallback((auth: AuthConfig): Record<string, string> => {
    const headers: Record<string, string> = {};
    switch (auth.type) {
      case 'bearer':
        if (auth.bearerToken) {
          headers['Authorization'] = `Bearer ${auth.bearerToken}`;
        }
        break;
      case 'api-key':
        if (auth.apiKeyHeader && auth.apiKeyValue) {
          headers[auth.apiKeyHeader] = auth.apiKeyValue;
        }
        break;
      case 'basic':
        if (auth.basicUsername && auth.basicPassword) {
          const credentials = btoa(
            `${auth.basicUsername}:${auth.basicPassword}`,
          );
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
    }
    return headers;
  }, []);

  const connect = useCallback(
    async (
      url: string,
      auth: AuthConfig,
      customHeaders: HeaderPair[],
    ) => {
      const socket = socketRef.current;
      if (!socket) return;

      let agentCardUrl = url.trim();
      if (!agentCardUrl) return;

      // Prepend http:// if no protocol
      if (!/^[a-zA-Z]+:\/\//.test(agentCardUrl)) {
        agentCardUrl = 'http://' + agentCardUrl;
      }

      // Validate URL
      try {
        const parsed = new URL(agentCardUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setConnectionError('Protocol must be http or https.');
          return;
        }
      } catch {
        setConnectionError('Invalid URL.');
        return;
      }

      setIsConnecting(true);
      setConnectionError(null);
      setAgentCard(null);
      setCardValidationErrors([]);

      const authHeaders = buildAuthHeaders(auth);
      const headerPairs = customHeaders.reduce(
        (acc, h) => {
          if (h.key.trim() && h.value.trim()) {
            acc[h.key.trim()] = h.value.trim();
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      const allHeaders = {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headerPairs,
      };

      try {
        const response = await fetch('/agent-card', {
          method: 'POST',
          headers: allHeaders,
          body: JSON.stringify({url: agentCardUrl, sid: socket.id}),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        setAgentCard(data.card);
        setCardValidationErrors(data.validation_errors || []);

        // Initialize client via Socket.IO
        socket.emit('initialize_client', {
          url: agentCardUrl,
          customHeaders: {...authHeaders, ...headerPairs},
        });
      } catch (error) {
        setIsConnecting(false);
        setConnectionError((error as Error).message);
      }
    },
    [socketRef, buildAuthHeaders],
  );

  return {
    agentCard,
    cardValidationErrors,
    isConnected,
    isConnecting,
    connectionError,
    transport,
    inputModes,
    outputModes,
    connect,
  };
}
