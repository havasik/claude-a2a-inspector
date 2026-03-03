import {describe, it, expect} from 'vitest';
import {parseA2AEvent} from '@/lib/parseA2AEvent';
import type {AgentResponseEvent} from '@/types/a2a';

describe('parseA2AEvent', () => {
  const makeEvent = (
    overrides: Partial<AgentResponseEvent>,
  ): AgentResponseEvent => ({
    kind: 'message',
    id: 'test-id',
    validation_errors: [],
    ...overrides,
  });

  describe('error events', () => {
    it('should parse error events', () => {
      const event = makeEvent({error: 'Something went wrong'});
      const parsed = parseA2AEvent(event, 'display-1');

      expect(parsed.type).toBe('error');
      expect(parsed.textContent).toBe('Something went wrong');
      expect(parsed.isFinal).toBe(true);
    });

    it('should include validation errors on error events', () => {
      const event = makeEvent({
        error: 'Bad request',
        validation_errors: ['Missing field X'],
      });
      const parsed = parseA2AEvent(event, 'display-2');

      expect(parsed.validationErrors).toEqual(['Missing field X']);
    });
  });

  describe('status-update events', () => {
    it('should detect tool calls from status-update text', () => {
      const event = makeEvent({
        kind: 'status-update',
        status: {
          state: 'working',
          message: {
            parts: [
              {
                kind: 'text',
                text: '[Tool: Read]\n{\n  "file_path": "/data/test.txt"\n}',
              },
            ],
          },
        },
      });
      const parsed = parseA2AEvent(event, 'display-3');

      expect(parsed.type).toBe('tool-call');
      expect(parsed.toolName).toBe('Read');
      expect(parsed.toolInput).toContain('file_path');
      expect(parsed.taskState).toBe('working');
    });

    it('should parse tool call with output in subsequent parts', () => {
      const event = makeEvent({
        kind: 'status-update',
        status: {
          state: 'working',
          message: {
            parts: [
              {kind: 'text', text: '[Tool: Read]\n{"file_path": "/test.txt"}'},
              {kind: 'text', text: 'The file contains hello world'},
            ],
          },
        },
      });
      const parsed = parseA2AEvent(event, 'display-4');

      expect(parsed.type).toBe('tool-call');
      expect(parsed.toolName).toBe('Read');
      expect(parsed.toolOutput).toBe('The file contains hello world');
    });

    it('should parse non-tool status-update with text as agent-message', () => {
      const event = makeEvent({
        kind: 'status-update',
        status: {
          state: 'working',
          message: {
            parts: [{kind: 'text', text: 'Analyzing the image...'}],
          },
        },
      });
      const parsed = parseA2AEvent(event, 'display-5');

      expect(parsed.type).toBe('agent-message');
      expect(parsed.textContent).toBe('Analyzing the image...');
    });

    it('should parse empty status-update (no message, working state) as status-update-empty', () => {
      const event = makeEvent({
        kind: 'status-update',
        status: {
          state: 'working',
        },
      });
      const parsed = parseA2AEvent(event, 'display-empty');

      expect(parsed.type).toBe('status-update-empty');
      expect(parsed.textContent).toBe('');
    });

    it('should parse empty status-update with terminal state as task-status', () => {
      const event = makeEvent({
        kind: 'status-update',
        status: {
          state: 'canceled',
        },
      });
      const parsed = parseA2AEvent(event, 'display-canceled');

      expect(parsed.type).toBe('task-status');
      expect(parsed.taskState).toBe('canceled');
    });

    it('should parse multiple tool calls from multiple parts', () => {
      const event = makeEvent({
        kind: 'status-update',
        status: {
          state: 'canceled',
          message: {
            parts: [
              {kind: 'text', text: '[Tool: TodoWrite]\n{"todos": []}'},
              {kind: 'text', text: '[Tool: Bash]\n{"command": "mkdir -p /tmp/test"}'},
              {kind: 'text', text: '[Tool: Write]\n{"file_path": "/tmp/test.txt", "content": "hello"}'},
            ],
          },
        },
      });
      const parsed = parseA2AEvent(event, 'display-multi-tool');

      expect(parsed.type).toBe('tool-call');
      expect(parsed.toolCalls).toHaveLength(3);
      expect(parsed.toolCalls![0].toolName).toBe('TodoWrite');
      expect(parsed.toolCalls![1].toolName).toBe('Bash');
      expect(parsed.toolCalls![2].toolName).toBe('Write');
      expect(parsed.taskState).toBe('canceled');
    });

    it('should handle final flag', () => {
      const event = makeEvent({
        kind: 'status-update',
        final: true,
        status: {
          state: 'completed',
          message: {parts: [{kind: 'text', text: 'Done'}]},
        },
      });
      const parsed = parseA2AEvent(event, 'display-6');

      expect(parsed.isFinal).toBe(true);
    });
  });

  describe('task events', () => {
    it('should parse task with artifacts as artifact type', () => {
      const event = makeEvent({
        kind: 'task',
        status: {state: 'completed'},
        artifacts: [
          {
            artifactId: 'art-1',
            parts: [{kind: 'text', text: 'This is the result'}],
          },
        ],
      });
      const parsed = parseA2AEvent(event, 'display-7');

      expect(parsed.type).toBe('artifact');
      expect(parsed.textContent).toBe('This is the result');
      expect(parsed.artifacts).toHaveLength(1);
    });

    it('should parse task without artifacts as task-status', () => {
      const event = makeEvent({
        kind: 'task',
        status: {state: 'working'},
      });
      const parsed = parseA2AEvent(event, 'display-8');

      expect(parsed.type).toBe('task-status');
      expect(parsed.taskState).toBe('working');
    });
  });

  describe('artifact-update events', () => {
    it('should parse artifact-update events', () => {
      const event = makeEvent({
        kind: 'artifact-update',
        artifact: {
          parts: [{kind: 'text', text: 'Updated artifact content'}],
        },
      });
      const parsed = parseA2AEvent(event, 'display-9');

      expect(parsed.type).toBe('artifact');
      expect(parsed.textContent).toBe('Updated artifact content');
    });
  });

  describe('message events', () => {
    it('should parse message events', () => {
      const event = makeEvent({
        kind: 'message',
        parts: [{kind: 'text', text: 'Hello, how can I help?'}],
      });
      const parsed = parseA2AEvent(event, 'display-10');

      expect(parsed.type).toBe('agent-message');
      expect(parsed.textContent).toBe('Hello, how can I help?');
    });

    it('should handle messages with multiple text parts', () => {
      const event = makeEvent({
        kind: 'message',
        parts: [
          {kind: 'text', text: 'First part'},
          {kind: 'text', text: 'Second part'},
        ],
      });
      const parsed = parseA2AEvent(event, 'display-11');

      expect(parsed.type).toBe('agent-message');
      expect(parsed.textContent).toBe('First part\nSecond part');
    });
  });

  describe('thinking data parts', () => {
    it('should extract thinking steps from data parts with thinking metadata', () => {
      const event = makeEvent({
        kind: 'status-update',
        status: {
          state: 'working',
          message: {
            parts: [
              {
                kind: 'data',
                data: {thinking: 'I need to check the files'},
                metadata: {kind: 'thinking'},
              },
              {
                kind: 'text',
                text: '[Tool: Bash]\n{"command": "ls /tmp"}',
              },
              {
                kind: 'text',
                text: 'Here are the files in /tmp.',
              },
            ],
          },
        },
      });
      const parsed = parseA2AEvent(event, 'display-thinking');

      expect(parsed.type).toBe('tool-call');
      expect(parsed.thinkingSteps).toEqual(['I need to check the files']);
      expect(parsed.toolCalls).toHaveLength(1);
      expect(parsed.toolCalls![0].toolName).toBe('Bash');
      expect(parsed.textContent).toBe('Here are the files in /tmp.');
    });

    it('should not include thinking in final terminal status-update', () => {
      const event = makeEvent({
        kind: 'status-update',
        final: true,
        status: {
          state: 'completed',
          message: {
            parts: [
              {kind: 'data', data: {thinking: 'Done'}, metadata: {kind: 'thinking'}},
              {kind: 'text', text: '[Tool: Bash]\n{"command": "ls"}'},
              {kind: 'text', text: 'Result text'},
            ],
          },
        },
      });
      const parsed = parseA2AEvent(event, 'display-final-thinking');

      expect(parsed.type).toBe('task-status');
      expect(parsed.thinkingSteps).toBeUndefined();
    });
  });

  describe('context preservation', () => {
    it('should preserve the original event', () => {
      const event = makeEvent({kind: 'message', contextId: 'ctx-123'});
      const parsed = parseA2AEvent(event, 'display-12');

      expect(parsed.event).toBe(event);
      expect(parsed.displayId).toBe('display-12');
    });
  });
});
