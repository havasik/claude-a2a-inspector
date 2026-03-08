import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import {useSocket} from './socket-provider';
import type {
  AgentCard,
  ClientInitializedEvent,
  ConnectionState,
  ConnectionStatus,
} from '../lib/types';

type ConnectionAction =
  | {type: 'FETCH_CARD'}
  | {type: 'CARD_FETCHED'; card: AgentCard; errors: string[]}
  | {type: 'CARD_ERROR'; error: string}
  | {type: 'INITIALIZING'}
  | {
      type: 'INITIALIZED';
      transport: string;
      inputModes: string[];
      outputModes: string[];
    }
  | {type: 'INIT_ERROR'; error: string}
  | {type: 'SET_CONTEXT_ID'; contextId: string}
  | {type: 'DISCONNECT'}
  | {type: 'RESET_SESSION'};

const initialState: ConnectionState = {
  status: 'disconnected',
  card: null,
  cardValidationErrors: [],
  transport: null,
  inputModes: [],
  outputModes: [],
  contextId: null,
  error: null,
};

function connectionReducer(
  state: ConnectionState,
  action: ConnectionAction
): ConnectionState {
  switch (action.type) {
    case 'FETCH_CARD':
      return {...state, status: 'fetching-card', error: null};
    case 'CARD_FETCHED':
      return {
        ...state,
        card: action.card,
        cardValidationErrors: action.errors,
      };
    case 'CARD_ERROR':
      return {...state, status: 'error', error: action.error};
    case 'INITIALIZING':
      return {...state, status: 'initializing'};
    case 'INITIALIZED':
      return {
        ...state,
        status: 'connected',
        transport: action.transport,
        inputModes: action.inputModes,
        outputModes: action.outputModes,
        error: null,
      };
    case 'INIT_ERROR':
      return {...state, status: 'error', error: action.error};
    case 'SET_CONTEXT_ID':
      return {...state, contextId: action.contextId};
    case 'DISCONNECT':
      return initialState;
    case 'RESET_SESSION':
      return {...state, contextId: null};
    default:
      return state;
  }
}

interface AgentConnectionContextValue {
  state: ConnectionState;
  connect: (url: string, headers: Record<string, string>) => Promise<void>;
  disconnect: () => void;
  resetSession: () => void;
  setContextId: (id: string) => void;
}

const AgentConnectionContext =
  createContext<AgentConnectionContextValue | null>(null);

export function AgentConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {socket, emit} = useSocket();
  const [state, dispatch] = useReducer(connectionReducer, initialState);

  const connect = useCallback(
    async (url: string, headers: Record<string, string>) => {
      dispatch({type: 'FETCH_CARD'});

      try {
        const sid = socket?.id || '';
        const response = await fetch('/agent-card', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', ...headers},
          body: JSON.stringify({url, sid}),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as {detail?: string};
          throw new Error(
            errorData.detail || `HTTP ${response.status}`
          );
        }

        const data = (await response.json()) as {
          card: AgentCard;
          validation_errors: string[];
        };
        dispatch({
          type: 'CARD_FETCHED',
          card: data.card,
          errors: data.validation_errors,
        });

        dispatch({type: 'INITIALIZING'});
        emit('initialize_client', {url, customHeaders: headers});
      } catch (err) {
        dispatch({
          type: 'CARD_ERROR',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    [socket, emit]
  );

  useEffect(() => {
    if (!socket) return;

    const handleInitialized = (data: ClientInitializedEvent) => {
      if (data.status === 'success') {
        dispatch({
          type: 'INITIALIZED',
          transport: data.transport || 'unknown',
          inputModes: data.inputModes || ['text/plain'],
          outputModes: data.outputModes || ['text/plain'],
        });
      } else {
        dispatch({type: 'INIT_ERROR', error: data.message || 'Init failed'});
      }
    };

    socket.on('client_initialized', handleInitialized);
    return () => {
      socket.off('client_initialized', handleInitialized);
    };
  }, [socket]);

  const disconnect = useCallback(() => dispatch({type: 'DISCONNECT'}), []);
  const resetSession = useCallback(
    () => dispatch({type: 'RESET_SESSION'}),
    []
  );
  const setContextId = useCallback(
    (id: string) => dispatch({type: 'SET_CONTEXT_ID', contextId: id}),
    []
  );

  return (
    <AgentConnectionContext.Provider
      value={{state, connect, disconnect, resetSession, setContextId}}
    >
      {children}
    </AgentConnectionContext.Provider>
  );
}

export function useAgentConnection(): AgentConnectionContextValue {
  const ctx = useContext(AgentConnectionContext);
  if (!ctx)
    throw new Error(
      'useAgentConnection must be used within AgentConnectionProvider'
    );
  return ctx;
}
