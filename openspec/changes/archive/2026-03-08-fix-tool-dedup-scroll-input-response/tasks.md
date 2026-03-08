## 1. Append guard for streaming chunks

- [x] 1.1 In `app.tsx`, skip `addAgentResponse` for events with `append: true` — only process ARK envelopes for these

## 2. Render-time deduplication

- [x] 2.1 Add `deduplicateMessages` function to `message-list.tsx` that filters before grouping
- [x] 2.2 Filter out empty `status-update` events when `artifact-update` events exist for the same response id
- [x] 2.3 Collapse multiple `artifact-update` events with the same ARK envelope id to only the last one (tool-call pending/working/completed → one card)

## 3. Fix scroll

- [x] 3.1 Bypass StickToBottom — use `overflow-y-auto` on ChatPanel scroll container
- [x] 3.2 Add auto-scroll effect: scroll to bottom on new messages when user is at bottom, preserve position when scrolled up
- [x] 3.3 Ensure `min-h-0` on flex containers and `h-full` on SplitPane panes

## 4. Backend forwards DataParts

- [x] 4.1 In `handle_send_message` in `backend/app.py`, process `json_data.get('parts', [])` and wrap `type: 'data'` parts as A2A `DataPart` objects

## 5. Verification

- [x] 5.1 Full build passes (JS + CSS + TypeScript + tests)
- [ ] 5.2 Test with live agent: tool calls show as single card, conversation scrolls, input responses reach the agent
