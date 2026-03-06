import {describe, it, expect} from 'vitest';
import {
  isArkEnvelope,
  isKnownArkKind,
  extractArkParts,
  extractPlainText,
} from '../src/lib/ark-parser';
import type {AgentResponseEvent} from '../src/lib/types';

describe('isArkEnvelope', () => {
  it('returns true for valid ARK envelope', () => {
    const envelope = {
      ark: {
        version: '0.1.0',
        kind: 'tool-call',
        id: 'tc-1',
        timestamp: '2024-01-01T00:00:00Z',
        payload: {name: 'test', status: 'pending'},
      },
    };
    expect(isArkEnvelope(envelope)).toBe(true);
  });

  it('returns false for non-object', () => {
    expect(isArkEnvelope(null)).toBe(false);
    expect(isArkEnvelope('string')).toBe(false);
    expect(isArkEnvelope(42)).toBe(false);
  });

  it('returns false for object without ark field', () => {
    expect(isArkEnvelope({foo: 'bar'})).toBe(false);
  });

  it('returns false for ark without required fields', () => {
    expect(isArkEnvelope({ark: {version: '0.1.0'}})).toBe(false);
    expect(
      isArkEnvelope({ark: {version: '0.1.0', kind: 'text', id: 'x'}})
    ).toBe(false);
  });
});

describe('isKnownArkKind', () => {
  it('returns true for known kinds', () => {
    expect(isKnownArkKind('tool-call')).toBe(true);
    expect(isKnownArkKind('thought')).toBe(true);
    expect(isKnownArkKind('text')).toBe(true);
    expect(isKnownArkKind('text-stream')).toBe(true);
    expect(isKnownArkKind('input-request')).toBe(true);
    expect(isKnownArkKind('input-response')).toBe(true);
  });

  it('returns false for unknown kinds', () => {
    expect(isKnownArkKind('unknown')).toBe(false);
    expect(isKnownArkKind('')).toBe(false);
  });
});

describe('extractArkParts', () => {
  it('extracts ARK from DataPart in parts array', () => {
    const response = {
      kind: 'message' as const,
      validation_errors: [],
      parts: [
        {
          kind: 'data',
          data: {
            ark: {
              version: '0.1.0',
              kind: 'tool-call',
              id: 'tc-1',
              timestamp: '2024-01-01T00:00:00Z',
              payload: {name: 'test', status: 'pending'},
            },
          },
        },
      ],
    } satisfies AgentResponseEvent;

    const parts = extractArkParts(response);
    expect(parts).toHaveLength(1);
    expect(parts[0].ark.kind).toBe('tool-call');
  });

  it('returns empty array for non-ARK response', () => {
    const response = {
      kind: 'message' as const,
      validation_errors: [],
      parts: [{kind: 'text', text: 'Hello'}],
    } satisfies AgentResponseEvent;

    expect(extractArkParts(response)).toHaveLength(0);
  });

  it('extracts multiple ARK parts', () => {
    const response = {
      kind: 'message' as const,
      validation_errors: [],
      parts: [
        {
          kind: 'data',
          data: {
            ark: {
              version: '0.1.0',
              kind: 'thought',
              id: 't-1',
              timestamp: '2024-01-01T00:00:00Z',
              payload: {status: 'complete', step: 1, content: 'thinking'},
            },
          },
        },
        {
          kind: 'data',
          data: {
            ark: {
              version: '0.1.0',
              kind: 'tool-call',
              id: 'tc-1',
              timestamp: '2024-01-01T00:00:00Z',
              payload: {name: 'search', status: 'pending'},
            },
          },
        },
      ],
    } satisfies AgentResponseEvent;

    const parts = extractArkParts(response);
    expect(parts).toHaveLength(2);
  });

  it('extracts ARK from artifact-update (singular artifact field)', () => {
    const response = {
      kind: 'artifact-update' as const,
      validation_errors: [],
      artifact: {
        artifactId: 'art-1',
        parts: [
          {
            kind: 'data',
            data: {
              ark: {
                version: '0.1.0',
                kind: 'thought',
                id: 'th-1',
                timestamp: '2024-01-01T00:00:00Z',
                payload: {status: 'complete', step: 1, content: 'thinking'},
              },
            },
          },
        ],
      },
    } satisfies AgentResponseEvent;

    const parts = extractArkParts(response);
    expect(parts).toHaveLength(1);
    expect(parts[0].ark.kind).toBe('thought');
  });

  it('extracts ARK from status-update message parts', () => {
    const response = {
      kind: 'status-update' as const,
      validation_errors: [],
      status: {
        state: 'working',
        message: {
          parts: [
            {
              kind: 'data',
              data: {
                ark: {
                  version: '0.1.0',
                  kind: 'text-stream',
                  id: 'ts-1',
                  timestamp: '2024-01-01T00:00:00Z',
                  payload: {status: 'streaming', chunk: 'hello', seq: 0},
                },
              },
            },
          ],
        },
      },
    } satisfies AgentResponseEvent;

    const parts = extractArkParts(response);
    expect(parts).toHaveLength(1);
    expect(parts[0].ark.kind).toBe('text-stream');
  });
});

describe('extractPlainText', () => {
  it('extracts text from text parts', () => {
    const response = {
      kind: 'message' as const,
      validation_errors: [],
      parts: [
        {kind: 'text', text: 'Hello'},
        {kind: 'text', text: ' world'},
      ],
    } satisfies AgentResponseEvent;

    expect(extractPlainText(response)).toBe('Hello\n world');
  });

  it('returns empty for response with no text parts', () => {
    const response = {
      kind: 'message' as const,
      validation_errors: [],
      parts: [{kind: 'data', data: {}}],
    } satisfies AgentResponseEvent;

    expect(extractPlainText(response)).toBe('');
  });

  it('extracts text from status-update message parts', () => {
    const response = {
      kind: 'status-update' as const,
      validation_errors: [],
      status: {
        state: 'working',
        message: {
          parts: [{text: 'Processing...'}],
        },
      },
    } satisfies AgentResponseEvent;

    expect(extractPlainText(response)).toBe('Processing...');
  });
});
