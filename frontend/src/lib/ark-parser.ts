import type {AgentResponseEvent, ArkEnvelope, ArkEventKind} from './types';

const VALID_ARK_KINDS: ArkEventKind[] = [
  'tool-call',
  'input-request',
  'input-response',
  'thought',
  'text',
  'text-stream',
];

/**
 * Check if a value is a valid ARK envelope.
 */
export function isArkEnvelope(data: unknown): data is ArkEnvelope {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.ark !== 'object' || obj.ark === null) return false;
  const ark = obj.ark as Record<string, unknown>;
  return (
    typeof ark.version === 'string' &&
    typeof ark.kind === 'string' &&
    typeof ark.id === 'string' &&
    typeof ark.timestamp === 'string' &&
    typeof ark.payload === 'object' &&
    ark.payload !== null
  );
}

/**
 * Check if an ARK envelope has a known kind.
 */
export function isKnownArkKind(kind: string): kind is ArkEventKind {
  return VALID_ARK_KINDS.includes(kind as ArkEventKind);
}

/**
 * Extract ARK envelopes from an agent response's data parts.
 * Returns an array of ARK envelopes found in the response.
 */
export function extractArkParts(response: AgentResponseEvent): ArkEnvelope[] {
  const parts: ArkEnvelope[] = [];

  // Check if response itself contains ark data (varies by agent implementation)
  if (isArkEnvelope(response)) {
    parts.push(response as unknown as ArkEnvelope);
    return parts;
  }

  // Check in parts array if present
  const responseParts = (response as Record<string, unknown>).parts;
  if (Array.isArray(responseParts)) {
    for (const part of responseParts) {
      if (typeof part === 'object' && part !== null) {
        const p = part as Record<string, unknown>;
        // A2A DataPart with kind "data"
        if (p.kind === 'data' && isArkEnvelope(p.data)) {
          parts.push(p.data as ArkEnvelope);
        }
        // Direct ARK envelope in parts
        if (isArkEnvelope(p)) {
          parts.push(p as unknown as ArkEnvelope);
        }
      }
    }
  }

  // Check in artifacts for task responses
  const artifacts = (response as Record<string, unknown>).artifacts;
  if (Array.isArray(artifacts)) {
    for (const artifact of artifacts) {
      if (typeof artifact === 'object' && artifact !== null) {
        const artifactParts = (artifact as Record<string, unknown>).parts;
        if (Array.isArray(artifactParts)) {
          for (const part of artifactParts) {
            if (typeof part === 'object' && part !== null) {
              const p = part as Record<string, unknown>;
              if (p.kind === 'data' && isArkEnvelope(p.data)) {
                parts.push(p.data as ArkEnvelope);
              }
            }
          }
        }
      }
    }
  }

  return parts;
}

/**
 * Extract plain text content from an agent response (non-ARK parts).
 */
export function extractPlainText(response: AgentResponseEvent): string {
  const texts: string[] = [];

  const responseParts = (response as Record<string, unknown>).parts;
  if (Array.isArray(responseParts)) {
    for (const part of responseParts) {
      if (typeof part === 'object' && part !== null) {
        const p = part as Record<string, unknown>;
        if (p.kind === 'text' && typeof p.text === 'string') {
          texts.push(p.text);
        }
        // TextPart without kind
        if (typeof p.text === 'string' && !p.kind) {
          texts.push(p.text);
        }
      }
    }
  }

  // For status-update messages
  const status = (response as Record<string, unknown>).status;
  if (typeof status === 'object' && status !== null) {
    const statusMsg = (status as Record<string, unknown>).message;
    if (typeof statusMsg === 'object' && statusMsg !== null) {
      const msgParts = (statusMsg as Record<string, unknown>).parts;
      if (Array.isArray(msgParts)) {
        for (const part of msgParts) {
          if (typeof part === 'object' && part !== null) {
            const p = part as Record<string, unknown>;
            if (typeof p.text === 'string') {
              texts.push(p.text);
            }
          }
        }
      }
    }
  }

  return texts.join('\n');
}
