import {describe, it, expect} from 'vitest';
import React from 'react';
import {renderHook, act} from '@testing-library/react';
import {ArkStateProvider, useArkState} from '../src/providers/ark-state-provider';
import type {ArkEnvelope} from '../src/lib/types';

function wrapper({children}: {children: React.ReactNode}) {
  return React.createElement(ArkStateProvider, null, children);
}

function makeEnvelope(
  kind: string,
  id: string,
  payload: Record<string, unknown>
): ArkEnvelope {
  return {
    ark: {
      version: '0.1.0',
      kind,
      id,
      timestamp: new Date().toISOString(),
      payload,
    },
  };
}

describe('ARK state reducer', () => {
  it('adds a tool-call event', () => {
    const {result} = renderHook(() => useArkState(), {wrapper});

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('tool-call', 'tc-1', {
          name: 'search',
          status: 'pending',
        })
      );
    });

    expect(result.current.arkState.events.size).toBe(1);
    const event = result.current.arkState.events.get('tc-1');
    expect(event?.kind).toBe('tool-call');
    expect(event?.status).toBe('pending');
  });

  it('replaces tool-call state on update', () => {
    const {result} = renderHook(() => useArkState(), {wrapper});

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('tool-call', 'tc-1', {
          name: 'search',
          status: 'pending',
        })
      );
    });

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('tool-call', 'tc-1', {
          name: 'search',
          status: 'completed',
          result: {found: true},
        })
      );
    });

    expect(result.current.arkState.events.size).toBe(1);
    const event = result.current.arkState.events.get('tc-1');
    expect(event?.status).toBe('completed');
    // Order should not duplicate
    expect(result.current.arkState.order).toHaveLength(1);
  });

  it('accumulates text-stream chunks', () => {
    const {result} = renderHook(() => useArkState(), {wrapper});

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('text-stream', 'ts-1', {
          status: 'streaming',
          chunk: 'Hello ',
          seq: 0,
        })
      );
    });

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('text-stream', 'ts-1', {
          status: 'streaming',
          chunk: 'world',
          seq: 1,
        })
      );
    });

    const event = result.current.arkState.events.get('ts-1');
    expect(event?.assembled).toBe('Hello world');
    expect(event?.chunks).toHaveLength(2);
  });

  it('accumulates thought chunks', () => {
    const {result} = renderHook(() => useArkState(), {wrapper});

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('thought', 'th-1', {
          status: 'streaming',
          step: 1,
          chunk: 'I need to ',
          seq: 0,
        })
      );
    });

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('thought', 'th-1', {
          status: 'done',
          step: 1,
          chunk: 'check the API',
          seq: 1,
        })
      );
    });

    const event = result.current.arkState.events.get('th-1');
    expect(event?.assembled).toBe('I need to check the API');
    expect(event?.status).toBe('done');
  });

  it('stores complete thought directly', () => {
    const {result} = renderHook(() => useArkState(), {wrapper});

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('thought', 'th-2', {
          status: 'complete',
          step: 1,
          content: 'Full reasoning text',
        })
      );
    });

    const event = result.current.arkState.events.get('th-2');
    expect(event?.assembled).toBe('Full reasoning text');
    expect(event?.status).toBe('complete');
  });

  it('resets state', () => {
    const {result} = renderHook(() => useArkState(), {wrapper});

    act(() => {
      result.current.processArkEnvelope(
        makeEnvelope('text', 'txt-1', {content: 'hello'})
      );
    });

    expect(result.current.arkState.events.size).toBe(1);

    act(() => {
      result.current.resetArkState();
    });

    expect(result.current.arkState.events.size).toBe(0);
    expect(result.current.arkState.order).toHaveLength(0);
  });
});
