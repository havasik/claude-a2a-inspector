import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useMessages} from '../src/hooks/use-messages';
import type {AgentResponseEvent} from '../src/lib/types';

describe('useMessages', () => {
  it('starts with empty messages', () => {
    const {result} = renderHook(() => useMessages());
    expect(result.current.messages).toHaveLength(0);
  });

  it('adds a user message', () => {
    const {result} = renderHook(() => useMessages());

    act(() => {
      result.current.addUserMessage('Hello agent');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Hello agent');
    expect(result.current.messages[0].id).toMatch(/^msg-/);
  });

  it('adds a user message with attachments', () => {
    const {result} = renderHook(() => useMessages());

    act(() => {
      result.current.addUserMessage('Check this file', [
        {name: 'test.txt', mimeType: 'text/plain', data: 'aGVsbG8=', size: 5},
      ]);
    });

    expect(result.current.messages[0].attachments).toHaveLength(1);
    expect(result.current.messages[0].attachments![0].name).toBe('test.txt');
  });

  it('adds an agent response', () => {
    const {result} = renderHook(() => useMessages());

    const response: AgentResponseEvent = {
      kind: 'message',
      validation_errors: [],
      parts: [{kind: 'text', text: 'Hello human'}],
    };

    act(() => {
      result.current.addAgentResponse(response);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('agent');
    expect(result.current.messages[0].content).toBe('Hello human');
    expect(result.current.messages[0].raw).toBe(response);
  });

  it('maintains message order', () => {
    const {result} = renderHook(() => useMessages());

    act(() => {
      result.current.addUserMessage('Question');
    });

    act(() => {
      result.current.addAgentResponse({
        kind: 'message',
        validation_errors: [],
        parts: [{kind: 'text', text: 'Answer'}],
      });
    });

    act(() => {
      result.current.addUserMessage('Follow up');
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].role).toBe('agent');
    expect(result.current.messages[2].role).toBe('user');
  });

  it('resets messages', () => {
    const {result} = renderHook(() => useMessages());

    act(() => {
      result.current.addUserMessage('Hello');
      result.current.addUserMessage('World');
    });

    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it('extracts text from status-update responses', () => {
    const {result} = renderHook(() => useMessages());

    act(() => {
      result.current.addAgentResponse({
        kind: 'status-update',
        validation_errors: [],
        status: {
          state: 'working',
          message: {
            parts: [{text: 'Processing your request...'}],
          },
        },
      });
    });

    expect(result.current.messages[0].content).toBe(
      'Processing your request...'
    );
  });
});
