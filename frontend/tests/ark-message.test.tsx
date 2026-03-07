import {describe, it, expect} from 'vitest';
import React from 'react';
import {render, screen} from '@testing-library/react';
import {ArkMessage} from '../src/components/ark/ark-message';
import {ArkStateProvider} from '../src/providers/ark-state-provider';
import {SocketProvider} from '../src/providers/socket-provider';
import {AgentConnectionProvider} from '../src/providers/agent-connection-provider';
import type {ArkEnvelope} from '../src/lib/types';

function renderWithProviders(envelope: ArkEnvelope) {
  return render(
    <SocketProvider>
      <AgentConnectionProvider>
        <ArkStateProvider>
          <ArkMessage envelope={envelope} />
        </ArkStateProvider>
      </AgentConnectionProvider>
    </SocketProvider>
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
    renderWithProviders(
      makeEnvelope('tool-call', 'tc-1', {
        name: 'get_weather',
        status: 'pending',
      })
    );
    expect(screen.getByText('get_weather')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('renders input-request with message and title', () => {
    renderWithProviders(
      makeEnvelope('input-request', 'ir-1', {
        type: 'confirmation',
        message: 'Are you sure?',
        title: 'Confirm action',
      })
    );
    expect(screen.getByText('Are you sure?')).toBeTruthy();
    expect(screen.getByText('Confirm action')).toBeTruthy();
  });

  it('renders input-request select with options', () => {
    renderWithProviders(
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
    renderWithProviders(
      makeEnvelope('input-response', 'ir-1', {
        type: 'confirmation',
        value: true,
      })
    );
    expect(screen.getByText(/Input response sent/)).toBeTruthy();
  });

  it('renders unknown kind as raw JSON fallback', () => {
    renderWithProviders(
      makeEnvelope('custom-kind', 'ck-1', {foo: 'bar'})
    );
    expect(screen.getByText(/Unknown ARK kind: custom-kind/)).toBeTruthy();
  });

  it('returns null for text kind', () => {
    const {container} = renderWithProviders(
      makeEnvelope('text', 'txt-1', {content: 'Hello'})
    );
    expect(container.innerHTML).toBe('');
  });
});
