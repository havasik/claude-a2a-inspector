// A2A Protocol types used by the inspector

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: Record<string, unknown>;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  extensions?: AgentExtension[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
}

export interface AgentExtension {
  uri: string;
  required?: boolean;
}

// Socket.IO event payloads

export interface AgentResponseEvent {
  kind: 'task' | 'status-update' | 'artifact-update' | 'message';
  validation_errors: string[];
  [key: string]: unknown;
}

export interface DebugLogEvent {
  type: 'request' | 'response' | 'error' | 'validation_error';
  data: Record<string, unknown>;
  id: string;
}

export interface ClientInitializedEvent {
  status: 'success' | 'error';
  transport?: string;
  inputModes?: string[];
  outputModes?: string[];
  message?: string;
}

// Message types for the chat

export type MessageRole = 'user' | 'agent';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  raw?: AgentResponseEvent;
  attachments?: Attachment[];
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
  size: number;
}

// ARK types

export interface ArkEnvelope {
  ark: {
    version: string;
    kind: string;
    id: string;
    timestamp: string;
    payload: Record<string, unknown>;
  };
}

export type ArkEventKind =
  | 'tool-call'
  | 'input-request'
  | 'input-response'
  | 'thought'
  | 'text'
  | 'text-stream';

export interface ArkAccumulatedEvent {
  kind: ArkEventKind;
  id: string;
  timestamp: string;
  payload: Record<string, unknown>;
  // For streaming kinds
  chunks?: string[];
  assembled?: string;
  status?: string;
}

// Connection state

export type ConnectionStatus =
  | 'disconnected'
  | 'fetching-card'
  | 'initializing'
  | 'connected'
  | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  card: AgentCard | null;
  cardValidationErrors: string[];
  transport: string | null;
  inputModes: string[];
  outputModes: string[];
  contextId: string | null;
  error: string | null;
}
