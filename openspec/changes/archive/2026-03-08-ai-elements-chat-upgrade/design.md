## Context

The A2A Inspector frontend has hand-rolled chat components that expose raw protocol internals (kind chips, validation badges) in the conversation UI. Messages render as static markdown blobs. Input requests are display-only. The ai-elements library (shadcn/ui pattern — copy components as owned source) provides purpose-built AI chat components with streaming, animations, and interactivity.

Current component tree:
```
Inspector (app.tsx)
├── ChatPanel → MessageList → MessageBubble (static markdown, kind chips, validation badges)
│                            └── ArkMessage → ArkTextStream | ArkToolCall | ArkThought | ArkInputRequest
├── ChatInput (basic text input + file picker)
└── DebugPanel (traffic log, validation, JSON viewer)
```

State infrastructure (providers, hooks) is solid and stays. The rendering layer swaps.

## Goals / Non-Goals

**Goals:**
- Replace hand-rolled chat/ARK components with ai-elements equivalents
- Remove all A2A protocol noise (kind chips, validation badges) from the chat UI
- Enable streaming markdown rendering via Streamdown (incremental parsing, no full re-parse per chunk)
- Make input-request events interactive (confirmation, select, multi-select, free-text) with responses flowing back to the agent
- Retain debug panel cross-linking (click chat message → shows raw JSON in debug panel)
- Deliver as a single cohesive change, not phased

**Non-Goals:**
- Changing the backend or A2A SDK
- Modifying the debug panel's internal rendering (traffic log, validation display, JSON viewer stay as-is)
- Adding new A2A protocol features
- Voice/audio components from ai-elements
- Canvas/workflow components from ai-elements

## Decisions

### 1. ai-elements installation: copy-in via `npx ai-elements add`

Components are copied into `frontend/src/components/ai-elements/` as owned source code, following the shadcn/ui pattern. This allows full customization for A2A Inspector needs (e.g., wiring `Tool` to ARK accumulated state) without fighting upstream abstractions.

**Alternative considered**: npm install as a dependency. Rejected because ai-elements is designed as copy-in, and we need to customize component internals to bridge with ARK state.

### 2. Component mapping

| ai-elements component | Replaces | Wired to |
|----------------------|----------|----------|
| `Conversation` | `ChatPanel` | `messages` array, scroll behavior |
| `Message` | `MessageBubble` | `ChatMessage` role/content, `onMessageClick` for debug cross-link |
| `MessageResponse` | `ArkTextStream` + `marked`/`DOMPurify` static rendering | `ArkAccumulatedEvent.assembled` for streaming, Streamdown for incremental markdown |
| `PromptInput` | `ChatInput` | `emit('send_message')`, attachment handling |
| `Tool` | `ArkToolCall` | `ArkAccumulatedEvent` payload (name, status, arguments, result, error, durationMs) |
| `Reasoning` | `ArkThought` | `ArkAccumulatedEvent` (step, label, assembled content, streaming status) |
| `Confirmation` | `ArkInputRequest` (confirmation type) | New `onRespond` callback → `emit('send_message')` with ARK envelope |
| `CodeBlock` | Raw `<pre>` tags in markdown | Shiki syntax highlighting |
| `Attachments` | Hand-rolled attachment chips | Existing `useAttachments` hook |
| `Shimmer` | CSS blinking cursor | Loading/streaming indicator |

### 3. Input response path: piggyback on `send_message`

When a user clicks a confirmation button or selects options, the frontend:
1. Builds an ARK `input-response` envelope with the user's selection
2. Wraps it in a standard `send_message` payload as a DataPart
3. Emits via the existing socket `send_message` event
4. Backend's existing `handle_send_message` forwards it to the agent via `a2a_client.send_message()`

This reuses the entire existing pipeline. No new socket handlers, no SDK changes.

```
User clicks [Confirm]
     │
     ▼
Build ARK input-response envelope:
  { ark: { kind: "input-response", payload: { type: "confirmation", value: true, requestId: "<original-request-id>" } } }
     │
     ▼
emit('send_message', {
  message: "",
  id: newMsgId,
  contextId: state.contextId,
  parts: [{ type: "data", data: arkEnvelope }]
})
     │
     ▼
Existing backend handler → A2A send_message() → Agent
```

**Alternative considered**: New dedicated socket event (`send_input_response`). Rejected because the A2A SDK only has `send_message()` — there's no separate input response API, so a new socket event would still end up calling `send_message()` internally.

### 4. Protocol metadata moves to debug panel only

The `KindChip` component and validation badge (✅/⚠️) are removed from `MessageBubble`. Instead:
- The debug panel's **Validation** tab already shows per-message validation status
- The debug panel's **Traffic Log** already shows event kinds
- Click-to-inspect (chat message → debug panel JSON viewer) provides the cross-link

No new debug panel features needed — the info is already there, just removing the chat-side duplication.

### 5. Message grouping strategy

Currently each `agent_response` socket event creates a separate `ChatMessage` and a separate bubble. This means a single agent turn can produce many bubbles (one per status-update, artifact-update, etc.).

New approach: group consecutive agent messages visually into a single conversation turn. The `Conversation` component from ai-elements handles this naturally — consecutive same-role messages render as a single visual block. The `messages` array stays flat (no structural change), but the rendering groups them.

### 6. Dependency additions

| Package | Purpose | Brought by |
|---------|---------|-----------|
| `@radix-ui/*` | Accessible primitives (dialog, popover, etc.) | ai-elements components |
| `framer-motion` | Animations for tool state transitions, message appearance | ai-elements components |
| `shiki` | Syntax highlighting in CodeBlock | ai-elements CodeBlock |
| `streamdown` | Streaming markdown parser | ai-elements MessageResponse |

`marked` and `DOMPurify` can be removed if all markdown rendering goes through Streamdown. Keep them during transition if any static rendering paths remain.

## Risks / Trade-offs

**[Risk] ai-elements components may not perfectly match ARK state shape** → Mitigation: Components are owned source code (copy-in). We customize the bridge layer between `ArkAccumulatedEvent` and component props. The `ArkMessage` router component becomes the adapter.

**[Risk] Input responses via `send_message` may not be understood by all agents** → Mitigation: This is an ARK extension convention, not core A2A. Agents that don't understand ARK input-response envelopes will simply ignore them. The UI should show the response was sent regardless.

**[Risk] Bundle size increase from new dependencies (Framer Motion, Shiki)** → Mitigation: Acceptable for an inspector/development tool. Shiki can use lazy-loaded language grammars. Framer Motion is tree-shakeable.

**[Risk] Streamdown behavior differs from `marked` for edge cases** → Mitigation: Streamdown is designed for streaming AI responses specifically. For the inspector use case (displaying agent text), it's a better fit than a general-purpose markdown parser. Test with various agent outputs during implementation.

**[Trade-off] Removing kind chips from chat loses at-a-glance protocol awareness** → Accepted: The debug panel provides this. The chat should feel like a chat, not a protocol inspector. Users who want protocol details click a message or look at the debug panel.
