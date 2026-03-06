import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useDebugLog} from '../src/hooks/use-debug-log';
import type {DebugLogEvent} from '../src/lib/types';

function makeLog(
  type: DebugLogEvent['type'],
  id: string,
  data: Record<string, unknown> = {}
): DebugLogEvent {
  return {type, id, data};
}

describe('useDebugLog', () => {
  it('starts with empty logs', () => {
    const {result} = renderHook(() => useDebugLog());
    expect(result.current.logs).toHaveLength(0);
  });

  it('adds a log entry', () => {
    const {result} = renderHook(() => useDebugLog());

    act(() => {
      result.current.addLog(makeLog('request', 'req-1', {method: 'send'}));
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].type).toBe('request');
    expect(result.current.logs[0].id).toBe('req-1');
  });

  it('enforces 500-entry cap', () => {
    const {result} = renderHook(() => useDebugLog());

    act(() => {
      for (let i = 0; i < 510; i++) {
        result.current.addLog(makeLog('response', `log-${i}`, {i}));
      }
    });

    expect(result.current.logs).toHaveLength(500);
    // Oldest entries should have been evicted (FIFO)
    expect(result.current.logs[0].id).toBe('log-10');
    expect(result.current.logs[499].id).toBe('log-509');
  });

  it('clears all logs', () => {
    const {result} = renderHook(() => useDebugLog());

    act(() => {
      result.current.addLog(makeLog('request', 'r1'));
      result.current.addLog(makeLog('response', 'r2'));
    });

    expect(result.current.logs).toHaveLength(2);

    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.logs).toHaveLength(0);
  });

  it('preserves log order', () => {
    const {result} = renderHook(() => useDebugLog());

    act(() => {
      result.current.addLog(makeLog('request', 'first'));
      result.current.addLog(makeLog('response', 'second'));
      result.current.addLog(makeLog('error', 'third'));
    });

    expect(result.current.logs[0].id).toBe('first');
    expect(result.current.logs[1].id).toBe('second');
    expect(result.current.logs[2].id).toBe('third');
  });

  it('handles all log types', () => {
    const {result} = renderHook(() => useDebugLog());

    const types: DebugLogEvent['type'][] = [
      'request',
      'response',
      'error',
      'validation_error',
    ];

    act(() => {
      for (const type of types) {
        result.current.addLog(makeLog(type, `${type}-1`));
      }
    });

    expect(result.current.logs).toHaveLength(4);
    expect(result.current.logs.map(l => l.type)).toEqual(types);
  });
});
