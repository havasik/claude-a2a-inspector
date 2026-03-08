import React, {createContext, useCallback, useContext, useReducer} from 'react';
import type {ArkAccumulatedEvent, ArkEnvelope, ArkEventKind} from '../lib/types';

interface ArkState {
  events: Map<string, ArkAccumulatedEvent>;
  order: string[];
}

type ArkAction =
  | {type: 'ARK_EVENT_RECEIVED'; envelope: ArkEnvelope}
  | {type: 'RESET'};

const initialState: ArkState = {
  events: new Map(),
  order: [],
};

function arkReducer(state: ArkState, action: ArkAction): ArkState {
  switch (action.type) {
    case 'ARK_EVENT_RECEIVED': {
      const {ark} = action.envelope;
      const {kind, id, timestamp, payload} = ark;
      const existing = state.events.get(id);
      const events = new Map(state.events);
      const order = existing ? [...state.order] : [...state.order, id];

      switch (kind) {
        case 'tool-call':
          // Replace entire state (latest event wins)
          events.set(id, {
            kind: kind as ArkEventKind,
            id,
            timestamp,
            payload,
            status: payload.status as string,
          });
          break;

        case 'thought': {
          const status = payload.status as string;
          if (status === 'complete') {
            events.set(id, {
              kind: kind as ArkEventKind,
              id,
              timestamp,
              payload,
              status,
              assembled: payload.content as string,
            });
          } else {
            // streaming or done — append chunk
            const prev = existing?.chunks || [];
            const chunk = payload.chunk as string;
            const chunks = [...prev, chunk];
            events.set(id, {
              kind: kind as ArkEventKind,
              id,
              timestamp,
              payload,
              status,
              chunks,
              assembled: chunks.join(''),
            });
          }
          break;
        }

        case 'text-stream': {
          const status = payload.status as string;
          const prev = existing?.chunks || [];
          const chunk = payload.chunk as string;
          const chunks = [...prev, chunk];
          events.set(id, {
            kind: kind as ArkEventKind,
            id,
            timestamp,
            payload,
            status,
            chunks,
            assembled: chunks.join(''),
          });
          break;
        }

        case 'text':
          events.set(id, {
            kind: kind as ArkEventKind,
            id,
            timestamp,
            payload,
            assembled: payload.content as string,
          });
          break;

        case 'input-request':
        case 'input-response':
          events.set(id, {
            kind: kind as ArkEventKind,
            id,
            timestamp,
            payload,
          });
          break;

        default:
          // Unknown kind — store raw
          events.set(id, {
            kind: kind as ArkEventKind,
            id,
            timestamp,
            payload,
          });
      }

      return {events, order};
    }

    case 'RESET':
      return {events: new Map(), order: []};

    default:
      return state;
  }
}

interface ArkStateContextValue {
  arkState: ArkState;
  processArkEnvelope: (envelope: ArkEnvelope) => void;
  resetArkState: () => void;
}

const ArkStateContext = createContext<ArkStateContextValue | null>(null);

export function ArkStateProvider({children}: {children: React.ReactNode}) {
  const [arkState, dispatch] = useReducer(arkReducer, initialState);

  const processArkEnvelope = useCallback((envelope: ArkEnvelope) => {
    dispatch({type: 'ARK_EVENT_RECEIVED', envelope});
  }, []);

  const resetArkState = useCallback(() => {
    dispatch({type: 'RESET'});
  }, []);

  return (
    <ArkStateContext.Provider
      value={{arkState, processArkEnvelope, resetArkState}}
    >
      {children}
    </ArkStateContext.Provider>
  );
}

export function useArkState(): ArkStateContextValue {
  const ctx = useContext(ArkStateContext);
  if (!ctx)
    throw new Error('useArkState must be used within ArkStateProvider');
  return ctx;
}
