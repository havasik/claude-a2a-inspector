// A2A Protocol types

export interface FileBase {
  name?: string;
  mimeType?: string;
}

export interface FileWithBytes extends FileBase {
  bytes: string;
  uri?: never;
}

export interface FileWithUri extends FileBase {
  uri: string;
  bytes?: never;
}

export type FileContent = FileWithBytes | FileWithUri;

export interface A2APart {
  kind?: string;
  text?: string;
  file?: FileContent;
  data?: Record<string, unknown>;
}

export interface A2AArtifact {
  artifactId?: string;
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  parts?: A2APart[];
}

export interface AgentResponseEvent {
  kind: 'task' | 'status-update' | 'artifact-update' | 'message';
  id: string;
  contextId?: string;
  final?: boolean;
  error?: string;
  status?: {
    state: string;
    message?: {parts?: A2APart[]; messageId?: string; role?: string};
    timestamp?: string;
  };
  artifact?: {
    parts?: A2APart[];
  };
  artifacts?: A2AArtifact[];
  parts?: A2APart[];
  taskId?: string;
  validation_errors: string[];
}

export interface DebugLog {
  type: 'request' | 'response' | 'error' | 'validation_error';
  data: Record<string, unknown>;
  id: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  data: string; // base64 encoded
  thumbnail?: string; // for images
}

export interface ClientInitializedData {
  status: string;
  message?: string;
  transport?: string;
  inputModes?: string[];
  outputModes?: string[];
}

// Parsed A2A event types for rendering
export type ParsedEventType =
  | 'user-message'
  | 'agent-message'
  | 'tool-call'
  | 'reasoning'
  | 'task-status'
  | 'artifact'
  | 'error';

export interface ParsedA2AEvent {
  type: ParsedEventType;
  event: AgentResponseEvent;
  displayId: string;
  // Extracted fields for convenience
  textContent?: string;
  toolName?: string;
  toolInput?: string;
  toolOutput?: string;
  taskState?: string;
  artifacts?: A2AArtifact[];
  validationErrors: string[];
  isFinal?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  rawEvent?: AgentResponseEvent;
  parsedEvent?: ParsedA2AEvent;
  attachments?: Attachment[];
  timestamp: number;
}
