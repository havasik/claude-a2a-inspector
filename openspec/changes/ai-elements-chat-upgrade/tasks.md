## 1. Setup & Dependencies

- [ ] 1.1 Install ai-elements components via `npx ai-elements add` — target components: Conversation, Message, MessageResponse, PromptInput, Tool, Reasoning, Confirmation, Attachments, CodeBlock, Shimmer
- [ ] 1.2 Install required peer dependencies: `@radix-ui/*` primitives, `framer-motion`, `shiki`, `streamdown`
- [ ] 1.3 Configure ai-elements output directory at `frontend/src/components/ai-elements/` and verify Tailwind CSS 4 compatibility with component styles

## 2. Core Chat Container

- [ ] 2.1 Replace `ChatPanel` + `MessageList` with ai-elements `Conversation` + `ConversationContent` — wire `messages` array, scroll behavior, and empty state
- [ ] 2.2 Replace `MessageBubble` with ai-elements `Message` component — wire role-based styling, remove `KindChip` and validation badge rendering entirely
- [ ] 2.3 Implement message grouping: consecutive same-role messages render as a single visual conversation turn
- [ ] 2.4 Preserve click-to-inspect: clicking a `Message` component triggers `onMessageClick` → debug panel JSON viewer

## 3. Streaming Text Rendering

- [ ] 3.1 Replace `ArkTextStream` with ai-elements `MessageResponse` — wire `ArkAccumulatedEvent.assembled` as content, `status === 'done'` as completion flag
- [ ] 3.2 Configure Streamdown as the incremental markdown parser for `MessageResponse` — verify chunks render without full re-parse
- [ ] 3.3 Replace `Shimmer` CSS cursor with ai-elements `Shimmer` component for streaming loading states
- [ ] 3.4 Ensure non-ARK agent messages (plain text) also render through `MessageResponse` with markdown formatting
- [ ] 3.5 Add entrance animations for new messages (fade-in / slide-up via Framer Motion)

## 4. Tool Call & Reasoning Components

- [ ] 4.1 Replace `ArkToolCall` with ai-elements `Tool` component — wire `ArkAccumulatedEvent` payload (name, status, arguments, result, error, durationMs) to Tool props
- [ ] 4.2 Verify animated state transitions (pending → working → completed / failed) work with ARK event updates
- [ ] 4.3 Replace `ArkThought` with ai-elements `Reasoning` component — wire step, label, assembled content, and streaming status
- [ ] 4.4 Verify Reasoning auto-expands during streaming and is collapsible when complete

## 5. Interactive Input Responses

- [ ] 5.1 Replace disabled `ConfirmationDisplay` with ai-elements `Confirmation` component — enabled confirm/deny buttons with click handlers
- [ ] 5.2 Replace disabled `SelectDisplay` with enabled radio buttons and submit action
- [ ] 5.3 Replace disabled `MultiSelectDisplay` with enabled checkboxes and submit action
- [ ] 5.4 Replace disabled `FreeTextDisplay` with enabled text input and submit action
- [ ] 5.5 Implement `onRespond` callback: builds ARK `input-response` envelope (kind, type, value, requestId) and emits via `send_message` socket event with envelope as DataPart
- [ ] 5.6 Add response state tracking: after user responds, disable inputs and visually indicate the selected choice
- [ ] 5.7 Show user's input response as a user-role message in the chat

## 6. User Input & Attachments

- [ ] 6.1 Replace `ChatInput` with ai-elements `PromptInput` — wire to `emit('send_message')`, support Enter/Shift+Enter, disabled state when disconnected
- [ ] 6.2 Replace hand-rolled attachment chips with ai-elements `Attachments` component — wire to existing `useAttachments` hook
- [ ] 6.3 Integrate `CodeBlock` with Shiki syntax highlighting for code blocks within agent responses

## 7. Cleanup & Verification

- [ ] 7.1 Remove old hand-rolled components: `MessageBubble`, `KindChip`, `ArkTextStream`, `ArkToolCall`, `ArkThought`, `ArkInputRequest` (and sub-components)
- [ ] 7.2 Remove `marked` and `DOMPurify` dependencies if fully replaced by Streamdown
- [ ] 7.3 Update `ArkMessage` router to map ARK event kinds to new ai-elements components
- [ ] 7.4 Verify debug panel cross-linking still works end-to-end (click chat message → JSON viewer shows raw data)
- [ ] 7.5 Test with a live agent: multi-turn conversation, streaming text, tool calls, thoughts, input requests
