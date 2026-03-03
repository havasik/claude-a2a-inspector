## ADDED Requirements

### Requirement: Status-update events are classified by part-level metadata
The system SHALL classify each part of a `status-update` event individually based on its `kind` and `metadata.kind` fields. Parts with `metadata.kind: "tool_use"` or text matching the `[Tool: <name>]` pattern SHALL be parsed as tool calls. Parts with `metadata.kind: "tool_result"` SHALL be paired with the preceding tool call as its output. Parts with `metadata.kind: "thinking"` (data parts) SHALL be extracted as thinking steps. Parts with `metadata.kind: "input_required"` SHALL be parsed as interactive questions. Remaining plain text parts SHALL be treated as the agent's response text.

#### Scenario: Status-update with tool_use and tool_result parts
- **WHEN** a `status-update` contains a text part with `metadata.kind: "tool_use"` followed by a text part with `metadata.kind: "tool_result"` for the same tool name
- **THEN** the tool result is paired with the tool call, and the tool card displays both Input and Output sections

#### Scenario: Status-update with mixed part types
- **WHEN** a `status-update` contains thinking data parts, tool call parts, and plain text parts
- **THEN** thinking steps render as a collapsible ChainOfThought block, tool calls render as collapsible tool cards, and plain text renders as a MessageResponse

### Requirement: Tool calls render as collapsible cards
The system SHALL render each tool call as a collapsible card showing the tool name in the header with a wrench icon. Expanding the card SHALL reveal the Input section (CodeBlock with JSON) and Output section (pre-formatted text) when available. All tool call cards SHALL default to collapsed.

#### Scenario: Single tool call in status-update
- **WHEN** a `status-update` contains one tool call part
- **THEN** a single collapsible tool card is rendered, defaulting to collapsed

#### Scenario: Multiple tool calls in one status-update
- **WHEN** a `status-update` contains multiple tool call parts (e.g., TodoWrite, Bash, Write)
- **THEN** each tool call renders as its own collapsible card, all defaulting to collapsed

#### Scenario: Tool result arrives in a separate event
- **WHEN** a `tool_result` event arrives after a prior `tool_use` event for the same tool
- **THEN** the result is merged into the existing tool call card's Output section in the chat history

### Requirement: Thinking steps render as ChainOfThought
The system SHALL extract `data` parts with `metadata.kind: "thinking"` and render them using the AI Elements `ChainOfThought` component with `ChainOfThoughtHeader` ("Thinking") and `ChainOfThoughtStep` entries. The block SHALL default to collapsed. Clicking the toggle SHALL NOT bubble to the parent message click handler (no JSON modal).

#### Scenario: Status-update with thinking data
- **WHEN** a `status-update` contains a data part with `metadata.kind: "thinking"` and a `thinking` string field
- **THEN** the thinking text renders as a `ChainOfThoughtStep` inside a collapsible `ChainOfThought` block

#### Scenario: Multiple thinking steps
- **WHEN** a `status-update` contains multiple thinking data parts
- **THEN** each renders as a separate `ChainOfThoughtStep` within the same `ChainOfThought` block

### Requirement: Task state transitions render as compact chips
The system SHALL render terminal task states (`completed`, `canceled`, `failed`, `input-required`) as compact chips with appropriate icons (checkmark, ban, alert, pause). Clicking the chip SHALL open the raw JSON modal.

#### Scenario: Task completed
- **WHEN** an empty `status-update` arrives with `state: "completed"`
- **THEN** a green "Completed" chip with checkmark icon is displayed

#### Scenario: Task canceled
- **WHEN** an empty `status-update` arrives with `state: "canceled"`
- **THEN** an orange "Canceled" chip with ban icon is displayed

#### Scenario: Tool calls with terminal state
- **WHEN** a `status-update` contains tool calls AND a terminal state
- **THEN** tool cards are rendered with the state chip shown below them

### Requirement: Interactive input-required questions
The system SHALL parse text parts with `metadata.kind: "input_required"` as interactive question forms. Single-select questions SHALL render as clickable option cards. Multi-select questions SHALL render as toggleable checkbox cards. All questions MUST be answered before the "Send Response" button becomes enabled. The response SHALL be sent as a structured message with `Header: Selection` format per line.

#### Scenario: Single-select question
- **WHEN** an `input-required` status-update contains a question with `multiSelect: false`
- **THEN** option cards are rendered; selecting one highlights it with a checkmark

#### Scenario: Multi-select question
- **WHEN** an `input-required` status-update contains a question with `multiSelect: true`
- **THEN** checkbox-style cards are rendered; multiple can be toggled on/off

#### Scenario: Multiple questions in one form
- **WHEN** an `input-required` status-update contains multiple questions
- **THEN** all questions are displayed, and the submit button is disabled until all have selections

#### Scenario: User submits response
- **WHEN** the user clicks "Send Response" after answering all questions
- **THEN** the selections are sent as a chat message and the form shows "Response sent."

### Requirement: Empty status-update heartbeats are skipped
The system SHALL silently skip `status-update` events that have `state: "working"` with no message content. These are heartbeat signals and SHALL NOT create chat messages. The loading shimmer indicator SHALL remain visible.

#### Scenario: Working heartbeat
- **WHEN** a `status-update` with `state: "working"` and no message parts arrives
- **THEN** no chat message is created and the "Agent is thinking..." shimmer continues

### Requirement: Message streaming uses event-id-based deduplication
The system SHALL use the A2A event `id` field to manage streaming updates. Agent-message events with the same `id` and identical text content SHALL replace in-place (dedup final/non-final). Task-status events with the same `id` SHALL replace in-place (state transitions). Tool-call events SHALL always append as new entries. Tool-result events SHALL merge into the matching prior tool-call entry.

#### Scenario: Final message deduplicates non-final
- **WHEN** a `status-update` with `final: false` and text "Hello" is followed by another with `final: true` and text "Hello" (same event id)
- **THEN** only one message is shown in the chat (the final replaces the non-final)

#### Scenario: Tool calls accumulate across events
- **WHEN** multiple `status-update` events arrive with different tool calls (same event id)
- **THEN** each tool call appears as its own entry in the chat, preserving the full history

### Requirement: Final summary status-updates show only state chip
The system SHALL render final `status-update` events with terminal states (`completed`, `canceled`, `failed`) as task-status chips only, without re-rendering tool calls or text that was already streamed from prior events.

#### Scenario: Final completed with content
- **WHEN** a `status-update` with `final: true` and `state: "completed"` arrives containing tool calls and text that were already shown
- **THEN** only a "Completed" state chip is rendered (no duplicate content)

### Requirement: Error responses render distinctly
The system SHALL render A2A error responses with red-tinted styling, an error icon, and the error message text.

#### Scenario: Agent returns an error
- **WHEN** an agent response contains an `error` field
- **THEN** the error is rendered with red border/background and the error text

### Requirement: Multimedia content renders inline
The system SHALL render file parts containing images, audio, and video inline. Images SHALL display in a bordered card with shadow, clickable to open full-size in a new tab. Audio SHALL render as playable controls. Video SHALL render as embedded players.

#### Scenario: Image file in agent response
- **WHEN** an agent response contains a file part with `mimeType` starting with `image/`
- **THEN** the image is displayed in a rounded bordered card with shadow, clickable to open full-size

#### Scenario: Audio file in agent response
- **WHEN** an agent response contains a file part with `mimeType` starting with `audio/`
- **THEN** an audio player control is rendered inline

#### Scenario: Video file in agent response
- **WHEN** an agent response contains a file part with `mimeType` starting with `video/`
- **THEN** a video player is rendered inline

### Requirement: Fallback rendering for unrecognized response types
The system SHALL gracefully handle unrecognized A2A response kinds by rendering them as generic `Message` components with the raw content displayed as `MessageResponse`.

#### Scenario: Unknown response kind
- **WHEN** an agent response has a `kind` value not in the recognized set
- **THEN** the response is rendered as a generic `Message` with `from="assistant"` showing the text content
