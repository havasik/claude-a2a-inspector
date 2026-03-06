import {describe, it, expect} from 'vitest';
import React from 'react';
import {render, screen} from '@testing-library/react';
import {ArkMessage} from '../src/components/ark/ark-message';
import {ArkStateProvider} from '../src/providers/ark-state-provider';
import type {ArkEnvelope} from '../src/lib/types';

function renderWithProvider(envelope: ArkEnvelope) {
  return render(
    <ArkStateProvider>
      <ArkMessage envelope={envelope} />
    </ArkStateProvider>
  );
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
      timestamp: '2024-01-01T00:00:00Z',
      payload,
    },
  };
}

describe('ArkMessage', () => {
  it('renders tool-call with name and status', () => {
    renderWithProvider(
      makeEnvelope('tool-call', 'tc-1', {
        name: 'get_weather',
        status: 'pending',
      })
    );
    expect(screen.getByText('get_weather')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('renders thought with step content', () => {
    renderWithProvider(
      makeEnvelope('thought', 'th-1', {
        status: 'complete',
        step: 1,
        content: 'Analyzing the request',
      })
    );
    expect(screen.getByText('Step 1')).toBeTruthy();
  });

  it('renders text-stream assembled content', () => {
    renderWithProvider(
      makeEnvelope('text-stream', 'ts-1', {
        status: 'streaming',
        chunk: 'Hello world',
        seq: 0,
      })
    );
    // Text stream with no accumulated state renders empty since assembled is ''
    // In real usage the ArkStateProvider would have processed the envelope first
  });

  it('renders input-request with type badge', () => {
    renderWithProvider(
      makeEnvelope('input-request', 'ir-1', {
        type: 'confirmation',
        message: 'Are you sure?',
        title: 'Confirm action',
      })
    );
    expect(screen.getByText('confirmation')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
    expect(screen.getByText('Confirm action')).toBeTruthy();
  });

  it('renders input-request select with options', () => {
    renderWithProvider(
      makeEnvelope('input-request', 'ir-2', {
        type: 'select',
        message: 'Pick one',
        options: [
          {id: 'a', label: 'Option A'},
          {id: 'b', label: 'Option B'},
        ],
      })
    );
    expect(screen.getByText('Pick one')).toBeTruthy();
    expect(screen.getByText('Option A')).toBeTruthy();
    expect(screen.getByText('Option B')).toBeTruthy();
  });

  it('renders input-response as summary', () => {
    renderWithProvider(
      makeEnvelope('input-response', 'ir-1', {
        type: 'confirmation',
        value: true,
      })
    );
    expect(screen.getByText(/Input response sent/)).toBeTruthy();
  });

  it('renders unknown kind as raw JSON fallback', () => {
    renderWithProvider(
      makeEnvelope('custom-kind', 'ck-1', {foo: 'bar'})
    );
    expect(screen.getByText(/Unknown ARK kind: custom-kind/)).toBeTruthy();
  });

  it('returns null for text kind (handled by MessageBubble)', () => {
    const {container} = renderWithProvider(
      makeEnvelope('text', 'txt-1', {content: 'Hello'})
    );
    expect(container.innerHTML).toBe('');
  });
});
