## Why

Three bugs remain in the chat experience after the ai-elements upgrade:

1. **Tool call duplication**: Each tool-call status transition (pending → working → completed) arrives as a separate `agent_response` without `append: true`, creating 3 ChatMessages. All 3 read the same ARK accumulated state, so the user sees 3 identical tool-call cards.

2. **No auto-scroll**: The previous scroll fix changed `StickToBottom`'s `overflow-y-hidden` to `overflow-y-auto`, which enabled manual scrolling but broke the library's auto-scroll-to-bottom behavior. The correct fix is to keep `overflow-y-hidden` and fix the height chain so `StickToBottom` has a bounded container.

3. **Input responses sent as plaintext**: When the user clicks a multi-select/confirmation/select option, the frontend sends `emit('send_message', { message: '', parts: [...arkEnvelope] })`. But the backend ignores the `parts` field entirely — it only reads `message` and `attachments`. The ARK input-response envelope never reaches the agent.

## What Changes

- **Upsert agent messages by response id**: Instead of always appending, `addAgentResponse` detects events belonging to the same turn (same `id`) and updates the existing ChatMessage in place. This fixes both tool-call duplication and any other non-append event duplication.
- **Fix scroll height chain**: Revert `overflow-y-auto` back to `overflow-y-hidden` on `Conversation`. Fix the actual height chain so `StickToBottom` has a bounded container and auto-scroll works.
- **Forward input-response ARK envelopes via backend**: Update the backend `handle_send_message` to process `parts` from the frontend payload, forwarding DataParts (including ARK input-response envelopes) to the agent.

## Capabilities

### New Capabilities

### Modified Capabilities
- `streaming-chat-rendering`: The append-only deduplication is insufficient — need upsert-by-id for all event types
- `interactive-input-responses`: Input responses must actually reach the agent, not just display locally

## Impact

- **`hooks/use-messages.ts`**: Add upsert logic keyed by response `id`
- **`components/ai-elements/conversation.tsx`**: Revert to `overflow-y-hidden`
- **`components/layout/split-pane.tsx`**: Ensure height chain resolves
- **`app.tsx`**: Remove `append`-only check, rely on upsert instead
- **`backend/app.py`**: Process `parts` from frontend payload, forward DataParts to agent
