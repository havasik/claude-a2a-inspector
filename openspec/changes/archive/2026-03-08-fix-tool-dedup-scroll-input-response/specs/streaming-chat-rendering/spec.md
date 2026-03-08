## MODIFIED Requirements

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
The conversation panel SHALL be scrollable when content exceeds the viewport height. The CSS height chain from the root layout through SplitPane to the Conversation component SHALL resolve to bounded pixel heights so the scroll container works.

#### Scenario: Long conversation is scrollable
- **WHEN** the conversation contains more messages than fit in the viewport
- **THEN** the user can scroll up to see earlier messages and scroll down to see recent messages

#### Scenario: Auto-scroll during streaming
- **WHEN** new agent response content arrives while the user is scrolled to the bottom
- **THEN** the conversation auto-scrolls to keep the latest content visible
