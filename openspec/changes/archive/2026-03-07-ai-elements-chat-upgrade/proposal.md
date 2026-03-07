## Why

The frontend chat window exposes raw A2A protocol internals (kind chips like `status-update`, `artifact-update`, validation badges) directly in the conversation UI, making it feel like a protocol log viewer rather than a chat. Messages render as static markdown blobs via `innerHTML` with no streaming feel. Input requests (confirmations, selects) are display-only with disabled buttons. The hand-rolled components lack the polish and interactivity of purpose-built AI chat components. Users cannot have a natural multi-turn conversation experience despite the backend fully supporting it.

## What Changes

- **Remove protocol noise from chat UI**: Move kind chips (`task`, `status-update`, `artifact-update`, `message`) and validation badges (✅/⚠️) out of message bubbles entirely — they belong in the debug panel only
- **Replace hand-rolled chat components with ai-elements**: Swap `MessageBubble`, `ChatPanel`, `MessageList`, `ChatInput` and all ARK renderers (`ArkTextStream`, `ArkToolCall`, `ArkThought`, `ArkInputRequest`) for ai-elements equivalents (`Conversation`, `Message`, `MessageResponse`, `Tool`, `Reasoning`, `PromptInput`, `Confirmation`, `Attachments`, `CodeBlock`, `Shimmer`)
- **Enable streaming markdown**: Replace `marked`/`DOMPurify` static rendering with Streamdown-based incremental markdown parsing via `MessageResponse`
- **Make input requests interactive**: Enable confirmation, select, multi-select, and free-text input requests so users can click to respond. Wire responses back through `send_message` with ARK `input-response` envelopes embedded as DataParts
- **Improve multi-turn chat UX**: Ensure the input area invites continued conversation with proper `PromptInput` component and visual flow between messages
- **Retain debug cross-linking**: Clicking a chat message still highlights it in the debug panel's raw JSON view

## Capabilities

### New Capabilities
- `ai-elements-integration`: Install and configure ai-elements components (Conversation, Message, MessageResponse, Tool, Reasoning, PromptInput, Confirmation, Attachments, CodeBlock, Shimmer) as owned source code with required dependencies (Radix UI, Framer Motion, Shiki, Streamdown)
- `interactive-input-responses`: Enable users to respond to agent input-request events (confirmation, select, multi-select, free-text) with clicks/selections that flow back to the agent via send_message with ARK input-response envelopes
- `streaming-chat-rendering`: Replace static markdown innerHTML rendering with Streamdown-based incremental streaming that renders chunks organically as they arrive

### Modified Capabilities

## Impact

- **Frontend components**: Complete replacement of `components/chat/` and `components/ark/` directories with ai-elements-based equivalents
- **Frontend dependencies**: New deps — ai-elements components (copied in), Radix UI primitives, Framer Motion, Shiki, Streamdown. Potential removal of `marked` and `DOMPurify` if fully replaced
- **Debug panel**: Gains kind chips and validation badges that were removed from chat bubbles. `components/debug/` updated to show per-message protocol metadata
- **Backend**: No changes required — existing `send_message` handler and `contextId` propagation already support the input-response-via-message pattern
- **ARK state provider**: Interface stays the same, but consumers change from hand-rolled components to ai-elements components reading the same accumulated state
