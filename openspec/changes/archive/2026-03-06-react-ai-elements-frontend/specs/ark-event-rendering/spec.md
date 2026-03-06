## ADDED Requirements

### Requirement: ARK envelope detection in agent responses
The system SHALL inspect every `agent_response` Socket.IO event for ARK envelopes within DataPart payloads. An ARK envelope is identified by the presence of a top-level `ark` object with `version`, `kind`, `id`, `timestamp`, and `payload` fields. Non-ARK responses SHALL render as plain messages.

#### Scenario: Agent response contains ARK DataPart
- **WHEN** an `agent_response` event is received with a DataPart containing `data.ark.kind`
- **THEN** the system routes the payload to the ARK-specific renderer for that kind

#### Scenario: Agent response has no ARK DataPart
- **WHEN** an `agent_response` event is received without any ARK envelope
- **THEN** the system renders the response as a plain chat message (text or markdown)

#### Scenario: Unknown ARK kind received
- **WHEN** an `agent_response` contains an ARK envelope with an unrecognized `kind` value
- **THEN** the system renders the raw JSON payload in a code block as a fallback

### Requirement: Tool call lifecycle rendering
The system SHALL render `tool-call` ARK events as a collapsible tool display with status badges reflecting the current state: pending, working, completed, or failed. When a tool call's state updates (same `ark.id`), the display SHALL update in place.

#### Scenario: Tool call in pending state
- **WHEN** a `tool-call` event with `status: "pending"` is received
- **THEN** the system displays the tool name with a pending status badge

#### Scenario: Tool call transitions to working
- **WHEN** a `tool-call` event with `status: "working"` and the same `ark.id` is received
- **THEN** the system updates the existing tool display to show a working/spinner status badge

#### Scenario: Tool call completes successfully
- **WHEN** a `tool-call` event with `status: "completed"` is received
- **THEN** the system displays the tool name, arguments, result, and a success status badge

#### Scenario: Tool call fails
- **WHEN** a `tool-call` event with `status: "failed"` is received
- **THEN** the system displays the tool name, arguments, error code, error message, and an error status badge

### Requirement: Thought/reasoning rendering
The system SHALL render `thought` ARK events as a collapsible reasoning panel. Complete thoughts display in full. Streaming thoughts accumulate chunks progressively and display with an active animation until the `done` status is received.

#### Scenario: Complete thought received
- **WHEN** a `thought` event with `status: "complete"` is received
- **THEN** the system displays the full thought content in a collapsible reasoning panel with the step number

#### Scenario: Streaming thought chunks received
- **WHEN** multiple `thought` events with `status: "streaming"` and the same `ark.id` are received
- **THEN** the system concatenates chunks in `seq` order and displays progressively with an active animation

#### Scenario: Streaming thought completes
- **WHEN** a `thought` event with `status: "done"` is received for a streaming thought
- **THEN** the system stops the active animation and displays the final assembled text as a completed reasoning panel

### Requirement: Text stream rendering with progressive reveal
The system SHALL render `text-stream` ARK events with a shimmer/progressive reveal animation during streaming. When the stream completes (`status: "done"`), the system SHALL display the assembled text as a standard markdown-rendered message.

#### Scenario: Text stream chunks arriving
- **WHEN** `text-stream` events with `status: "streaming"` are received
- **THEN** the system displays the assembled text with a shimmer animation effect

#### Scenario: Text stream completes
- **WHEN** a `text-stream` event with `status: "done"` is received
- **THEN** the system removes the shimmer animation and renders the full text as markdown

### Requirement: Plain text rendering via ARK
The system SHALL render `text` ARK events as standard chat messages with markdown support.

#### Scenario: ARK text event received
- **WHEN** a `text` event is received with `payload.content`
- **THEN** the system renders the content as a markdown-formatted agent message

### Requirement: Input request display
The system SHALL render `input-request` ARK events as interactive-looking UI elements matching the request type: confirmation buttons, select dropdown, multi-select checkboxes, or free-text input. In this version, these elements SHALL be display-only (non-functional) since the backend does not support forwarding input-response messages.

#### Scenario: Confirmation input request received
- **WHEN** an `input-request` event with `type: "confirmation"` is received
- **THEN** the system displays the message text and confirm/deny buttons (disabled, display-only)

#### Scenario: Select input request received
- **WHEN** an `input-request` event with `type: "select"` is received
- **THEN** the system displays the message text and a list of selectable options (disabled, display-only)

#### Scenario: Multi-select input request received
- **WHEN** an `input-request` event with `type: "multi-select"` is received
- **THEN** the system displays the message text and a list of checkable options (disabled, display-only)

#### Scenario: Free-text input request received
- **WHEN** an `input-request` event with `type: "free-text"` is received
- **THEN** the system displays the message text and a text input field with placeholder (disabled, display-only)

### Requirement: ARK state accumulation
The system SHALL maintain an accumulated state store keyed by `ark.id`. For `tool-call` events, the latest event replaces the previous state. For `thought` and `text-stream` events, chunks SHALL be appended in `seq` order and assembled into complete text. The store SHALL reset when a new session is started.

#### Scenario: Tool call state replacement
- **WHEN** a `tool-call` event is received with an `ark.id` that already exists in the store
- **THEN** the stored state for that ID is replaced with the new event payload

#### Scenario: Text stream chunk accumulation
- **WHEN** a `text-stream` event is received with an `ark.id` that already exists in the store
- **THEN** the chunk is appended at the correct `seq` position and the assembled text is updated

#### Scenario: Session reset clears ARK state
- **WHEN** the user starts a new session
- **THEN** the ARK state store is cleared completely
