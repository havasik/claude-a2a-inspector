## ADDED Requirements

### Requirement: Chat container uses ai-elements Conversation component
The chat panel SHALL use the ai-elements `Conversation` and `ConversationContent` components as the top-level chat container, replacing the hand-rolled `ChatPanel` and `MessageList`.

#### Scenario: Messages render inside Conversation component
- **WHEN** the user is connected to an agent and messages exist
- **THEN** messages render inside the ai-elements `Conversation` container with proper scroll behavior and empty state handling

### Requirement: Message bubbles use ai-elements Message component
Individual messages SHALL use the ai-elements `Message` component with role-based styling, replacing the hand-rolled `MessageBubble`. Clicking a message SHALL still trigger the debug panel cross-link (showing raw JSON).

#### Scenario: User message renders with user styling
- **WHEN** a user message is displayed
- **THEN** it renders using the ai-elements `Message` component with user role styling

#### Scenario: Agent message renders without protocol metadata
- **WHEN** an agent message is displayed in the chat
- **THEN** it renders using the ai-elements `Message` component with NO kind chips (status-update, artifact-update, task, message) and NO validation badges (checkmark/warning)

#### Scenario: Clicking a message opens debug JSON viewer
- **WHEN** the user clicks any message in the chat
- **THEN** the debug panel switches to the JSON tab showing that message's raw data

### Requirement: Tool calls use ai-elements Tool component
ARK `tool-call` events SHALL render using the ai-elements `Tool` component with animated state transitions, replacing `ArkToolCall`.

#### Scenario: Tool call shows lifecycle with animations
- **WHEN** a tool-call ARK event progresses through pending → working → completed
- **THEN** the ai-elements `Tool` component animates between states, showing the tool name, status, and expandable arguments/result sections

#### Scenario: Failed tool call shows error
- **WHEN** a tool-call ARK event has status `failed`
- **THEN** the `Tool` component displays the error with appropriate visual treatment

### Requirement: Chain of thought uses ai-elements Reasoning component
ARK `thought` events SHALL render using the ai-elements `Reasoning` component, replacing `ArkThought`.

#### Scenario: Streaming thought renders with thinking indicator
- **WHEN** a thought ARK event has status `streaming`
- **THEN** the `Reasoning` component shows accumulated content with a streaming visual indicator and auto-expands

#### Scenario: Completed thought is collapsible
- **WHEN** a thought ARK event has status `complete`
- **THEN** the `Reasoning` component shows the full content in a collapsible section

### Requirement: User input uses ai-elements PromptInput component
The chat input area SHALL use the ai-elements `PromptInput` component, replacing the hand-rolled `ChatInput`.

#### Scenario: Connected user can type and send messages
- **WHEN** the user is connected to an agent
- **THEN** the `PromptInput` component accepts text input, supports Enter to send / Shift+Enter for newline, and shows a send button

#### Scenario: Disconnected state shows disabled input
- **WHEN** the user is not connected to an agent
- **THEN** the `PromptInput` component is disabled with a placeholder indicating connection is required

### Requirement: File attachments use ai-elements Attachments component
File attachment previews and the file picker SHALL use the ai-elements `Attachments` component, replacing the hand-rolled attachment UI.

#### Scenario: Attached files show as previews
- **WHEN** the user attaches files before sending
- **THEN** the `Attachments` component shows file previews with names, sizes, and remove buttons

### Requirement: Code blocks use ai-elements CodeBlock with Shiki
Code blocks within agent responses SHALL render using the ai-elements `CodeBlock` component with Shiki syntax highlighting, replacing raw `<pre>` tags.

#### Scenario: Code in agent response has syntax highlighting
- **WHEN** an agent response contains a fenced code block with a language identifier
- **THEN** the `CodeBlock` component renders it with Shiki syntax highlighting and a copy button

### Requirement: Loading states use ai-elements Shimmer
The streaming loading indicator SHALL use the ai-elements `Shimmer` component, replacing the CSS-only blinking cursor.

#### Scenario: Shimmer shows during streaming
- **WHEN** a text-stream ARK event is in `streaming` status with no content yet
- **THEN** a `Shimmer` component indicates the agent is generating a response

### Requirement: Protocol metadata removed from chat bubbles
Kind chips (`task`, `status-update`, `artifact-update`, `message`) and validation badges (checkmark/warning emoji) SHALL NOT appear in chat message bubbles. This information is available in the debug panel only.

#### Scenario: Agent message has no protocol indicators
- **WHEN** an agent response arrives with kind `status-update` and passes validation
- **THEN** the chat bubble shows only the message content with no kind chip or validation badge

### Requirement: Consecutive agent messages group visually
Consecutive messages from the same role SHALL render as a visually grouped conversation turn rather than separate isolated bubbles.

#### Scenario: Multiple agent events render as grouped turn
- **WHEN** multiple consecutive `agent_response` events arrive for a single agent turn
- **THEN** they render as a single visual group in the chat, with individual ARK components (tool calls, thoughts, text) stacked within the group
