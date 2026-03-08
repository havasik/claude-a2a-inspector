## Context

After the ai-elements upgrade and the `append: true` streaming fix, three issues remain:

1. Tool-call events arrive as separate `agent_response` events (each status transition is a full `artifact-update`). The `append` guard doesn't catch these because they don't have `append: true`. Also, `status-update` events with empty content create noise messages.

2. Changing `overflow-y-hidden` to `overflow-y-auto` on the `Conversation` component enabled manual scrolling but broke `StickToBottom`'s auto-scroll mechanism.

3. The frontend `ArkInputRequest` sends input-response ARK envelopes in `parts`, but the backend `handle_send_message` only reads `message` and `attachments` — it never processes `parts`.

## Goals / Non-Goals

**Goals:**
- A single tool call shows as one card reflecting the final state
- Conversation scrolls and auto-scrolls to bottom
- Input responses reach the agent as ARK DataParts

**Non-Goals:**
- Changing the A2A SDK or protocol
- Adding new input-request types
- Changing how the debug panel displays events

## Decisions

### 1. Two-layer deduplication: append guard + render-time filtering

Upsert in `addAgentResponse` was attempted but broke message creation (replacing `raw` with chunk events lost ARK envelope references, causing empty renders). Instead, use two complementary strategies:

**Layer 1 — Append guard in `app.tsx`**: Skip `addAgentResponse` for events with `append: true`. These are continuation chunks — ARK state provider accumulates them, and `ArkMessage` re-renders from accumulated state. The ChatMessage's `raw` stays as the original event, preserving ARK envelope references.

**Layer 2 — Render-time dedup in `message-list.tsx`**: Before grouping messages for display, filter out duplicates:
- Drop empty `status-update` events when `artifact-update` events exist for the same response `id` (status-updates are protocol noise)
- For `artifact-update` events containing the same ARK envelope id (e.g., tool-call pending/working/completed), keep only the last one (which reflects the final state from arkState)

This preserves the simple append-only data model in `use-messages.ts` (no upsert) while cleaning up the view.

**Why not upsert**: Replacing `message.raw` with each new event loses the original ARK envelope structure. `extractArkParts(raw)` and `extractPlainText(raw)` return different results depending on which event is stored as `raw`. A status-update `raw` has no ARK parts and no content, causing the message to render as `null`.

### 2. Fix scroll: bypass StickToBottom, use simple auto-scroll

`StickToBottom` (`use-stick-to-bottom`) with `overflow-y-hidden` did not work in the esbuild setup — the library's internal scroll management failed to create a scrollable area despite a correct height chain. Instead, `ChatPanel` uses plain `overflow-y-auto` with a manual auto-scroll effect:

- A `ref` tracks the scroll container
- `onScroll` checks if user is near the bottom (within 50px threshold)
- A `useEffect` on `messages` scrolls to bottom when content changes, but only if user was already at the bottom (preserves scroll position when reading history)

The `Conversation` and `ConversationContent` ai-elements wrappers are no longer used for scroll management — `ChatPanel` handles it directly with a simple div.

```
div.h-screen.flex.flex-col           (app.tsx)
  └── SplitPane .flex.flex-1
      └── left pane .h-full.flex.flex-col.overflow-hidden
          └── div.h-full.min-h-0.flex.flex-col
              ├── ChatPanel div.flex-1.min-h-0.overflow-y-auto  (scrollable)
              └── ChatInput (fixed)
```

### 3. Backend forwards frontend `parts` as DataParts

In `handle_send_message`, process `json_data.get('parts', [])`. For each part with `type: 'data'`, wrap in A2A `DataPart` and include in the message sent to the agent.

## Risks / Trade-offs

**[Risk] Render-time dedup runs on every render** → Mitigation: The filter is O(n) with small n (messages per turn). No performance concern for typical conversations.

**[Risk] Dedup logic depends on event `kind` and ARK `id` fields** → Mitigation: Falls through safely — if fields are missing, messages pass the filter unchanged (no content lost, just potential duplicates).

**[Trade-off] Messages array grows with duplicate events** → Accepted: The array has protocol-level duplicates but the view is clean. The debug panel can still show all events for inspection.
