## ADDED Requirements

### Requirement: Streaming text uses Streamdown incremental markdown
ARK `text-stream` events SHALL render using Streamdown-based incremental markdown parsing via the ai-elements `MessageResponse` component. The parser SHALL NOT re-parse the entire accumulated text on each new chunk.

#### Scenario: Chunks render incrementally
- **WHEN** a text-stream ARK event delivers chunks sequentially ("Hello", " **world**", " how are you?")
- **THEN** each chunk is incrementally parsed and rendered without re-processing previous chunks, maintaining smooth visual flow

#### Scenario: Markdown formatting resolves as tokens complete
- **WHEN** streaming text contains partial markdown tokens (e.g., `**bol` then `d**`)
- **THEN** the text renders as plain text while the token is incomplete and resolves to formatted text once the token closes

### Requirement: Completed text renders as full markdown
When a `text-stream` ARK event reaches status `done`, the content SHALL render as fully parsed markdown with proper formatting, code blocks, lists, and links.

#### Scenario: Completed stream shows rich markdown
- **WHEN** a text-stream event transitions to status `done`
- **THEN** the full assembled text renders with all markdown formatting applied (headings, bold, italic, code blocks, lists, links)

### Requirement: Non-ARK agent messages render with markdown
Agent messages that do not contain ARK envelopes SHALL still render with markdown formatting via the `MessageResponse` component, not raw text.

#### Scenario: Plain agent message renders markdown
- **WHEN** an agent response has no ARK parts but contains markdown text
- **THEN** the text renders with full markdown formatting through the `MessageResponse` component

### Requirement: Streaming indicator shows during active generation
While an agent is actively streaming a response (text-stream status is `streaming`), a visual streaming indicator SHALL be displayed.

#### Scenario: Shimmer shows at stream start
- **WHEN** the first chunk of a text-stream arrives
- **THEN** a `Shimmer` or cursor indicator shows alongside the accumulating text

#### Scenario: Indicator disappears when stream completes
- **WHEN** a text-stream event reaches status `done`
- **THEN** the streaming indicator is removed and only the final rendered markdown remains

### Requirement: Append events do not create duplicate messages
Streaming `agent_response` events with `append: true` SHALL NOT create new ChatMessages. Only non-append events create messages. The ARK state provider handles chunk accumulation, and ArkMessage components re-render from accumulated state.

#### Scenario: Streaming text-stream chunks produce one visual message
- **WHEN** the backend emits 1 initial artifact-update (no append) followed by 5 append:true chunks for a text-stream
- **THEN** only 1 ChatMessage is created from the initial event, and ArkMessage renders the growing assembled text from ARK state

#### Scenario: Accumulated text grows with each chunk
- **WHEN** append:true events arrive with text-stream chunks
- **THEN** the ARK state accumulates chunks and the ArkMessage re-renders with the growing assembled text without creating new ChatMessages

### Requirement: Render-time deduplication of duplicate turn events
Multiple non-append events for the same turn (status-update, artifact-update with different ARK content) all share the same response `id`. The rendering layer SHALL deduplicate these before display using two rules:

1. Empty `status-update` events SHALL be filtered out when `artifact-update` events exist for the same response id (status-updates are protocol noise — artifact-updates carry the actual ARK content).
2. Multiple `artifact-update` events containing the same ARK envelope id (e.g., tool-call pending/working/completed) SHALL collapse to only the last one, which reflects the final state from ARK accumulated state.

#### Scenario: Tool-call status transitions render as one card
- **WHEN** the backend emits 3 artifact-update events for the same tool-call ARK id (pending, working, completed)
- **THEN** only 1 tool card is rendered showing the completed state

#### Scenario: Empty status-updates are hidden
- **WHEN** the backend emits status-update events with no text content alongside artifact-update events for the same response id
- **THEN** the status-update messages are not rendered

#### Scenario: Different ARK types in same turn all render
- **WHEN** a turn contains artifact-updates for a thought, a tool-call, and a text-stream (each with different ARK ids)
- **THEN** all three render — thought as Reasoning, tool-call as Tool card, text-stream as MessageResponse

### Requirement: Conversation panel is scrollable
The conversation panel SHALL be scrollable when content exceeds the viewport height. The CSS height chain from the root layout through SplitPane to the ChatPanel component SHALL resolve to bounded pixel heights so the scroll container works. Auto-scroll uses a simple `useEffect` on messages with a scroll-position threshold, not StickToBottom.

#### Scenario: Long conversation is scrollable
- **WHEN** the conversation contains more messages than fit in the viewport
- **THEN** the user can scroll up to see earlier messages and scroll down to see recent messages

#### Scenario: Auto-scroll during streaming
- **WHEN** new agent response content arrives while the user is scrolled to the bottom
- **THEN** the conversation auto-scrolls to keep the latest content visible

### Requirement: Backend deduplicates SSE fan-out events
When multiple `send_message` calls subscribe to the same A2A task (e.g., the original request stream and an input-response stream), the A2A server fans events to all subscribers. The backend SHALL deduplicate these events before emitting to the frontend, using a content fingerprint per session. Events with identical content (excluding the wrapping response id) SHALL be emitted only once.

#### Scenario: Duplicate SSE events are suppressed
- **WHEN** the same task event arrives on two SSE streams (original request + input-response)
- **THEN** the backend emits the event to the frontend only once

#### Scenario: Dedup state is cleaned up on disconnect
- **WHEN** a client disconnects
- **THEN** the backend clears the dedup fingerprint set for that session

### Requirement: Message appearance is animated
New messages entering the chat SHALL animate into view rather than appearing abruptly.

#### Scenario: Agent message animates in
- **WHEN** a new agent message appears in the chat
- **THEN** it animates into view with a smooth entrance transition (e.g., fade-in, slide-up)

#### Scenario: User message animates in
- **WHEN** the user sends a message
- **THEN** the message bubble animates into the chat with a smooth entrance transition
