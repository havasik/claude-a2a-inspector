## 1. Setup & Dependencies

- [x] 1.1 Install ai-elements components via `npx ai-elements add` — target components: Conversation, Message, MessageResponse, PromptInput, Tool, Reasoning, Confirmation, Attachments, CodeBlock, Shimmer
- [x] 1.2 Install required peer dependencies: `@radix-ui/*` primitives, `framer-motion`, `shiki`, `streamdown`
- [x] 1.3 Configure ai-elements output directory at `frontend/src/components/ai-elements/` and verify Tailwind CSS 4 compatibility with component styles

## 2. Core Chat Container

- [x] 2.1 Replace `ChatPanel` + `MessageList` with ai-elements `Conversation` + `ConversationContent` — wire `messages` array, scroll behavior, and empty state
- [x] 2.2 Replace `MessageBubble` with ai-elements `Message` component — wire role-based styling, remove `KindChip` and validation badge rendering entirely
- [x] 2.3 Implement message grouping: consecutive same-role messages render as a single visual conversation turn
- [x] 2.4 Preserve click-to-inspect: clicking a `Message` component triggers `onMessageClick` → debug panel JSON viewer

## 3. Streaming Text Rendering

- [x] 3.1 Replace `ArkTextStream` with ai-elements `MessageResponse` — wire `ArkAccumulatedEvent.assembled` as content, `status === 'done'` as completion flag
- [x] 3.2 Configure Streamdown as the incremental markdown parser for `MessageResponse` — verify chunks render without full re-parse
- [x] 3.3 Replace `Shimmer` CSS cursor with ai-elements `Shimmer` component for streaming loading states
- [x] 3.4 Ensure non-ARK agent messages (plain text) also render through `MessageResponse` with markdown formatting
- [x] 3.5 Add entrance animations for new messages (fade-in / slide-up via Framer Motion)

## 4. Tool Call & Reasoning Components

- [x] 4.1 Replace `ArkToolCall` with ai-elements `Tool` component — wire `ArkAccumulatedEvent` payload (name, status, arguments, result, error, durationMs) to Tool props
- [x] 4.2 Verify animated state transitions (pending → working → completed / failed) work with ARK event updates
- [x] 4.3 Replace `ArkThought` with ai-elements `Reasoning` component — wire step, label, assembled content, and streaming status
- [x] 4.4 Verify Reasoning auto-expands during streaming and is collapsible when complete

## 5. Interactive Input Responses

- [x] 5.1 Replace disabled `ConfirmationDisplay` with enabled confirm/deny buttons with click handlers
- [x] 5.2 Replace disabled `SelectDisplay` with enabled radio buttons and submit action
- [x] 5.3 Replace disabled `MultiSelectDisplay` with enabled checkboxes and submit action
- [x] 5.4 Replace disabled `FreeTextDisplay` with enabled text input and submit action
- [x] 5.5 Implement `onRespond` callback: builds ARK `input-response` envelope (kind, type, value, requestId) and emits via `send_message` socket event with envelope as DataPart
- [x] 5.6 Add response state tracking: after user responds, disable inputs and visually indicate the selected choice
- [x] 5.7 Show user's input response as a user-role message in the chat

## 6. User Input & Attachments

- [x] 6.1 Replace `ChatInput` with ai-elements styled input — wire to `emit('send_message')`, support Enter/Shift+Enter, disabled state when disconnected
- [x] 6.2 Replace hand-rolled attachment chips with ai-elements styled components — wire to existing `useAttachments` hook
- [x] 6.3 Integrate `CodeBlock` with Shiki syntax highlighting for code blocks within agent responses

## 7. Cleanup & Verification

- [x] 7.1 Remove old hand-rolled components: `MessageBubble`, `KindChip`, `ArkTextStream`, `ArkToolCall`, `ArkThought` (and sub-components)
- [x] 7.2 Remove `marked` and `DOMPurify` dependencies if fully replaced by Streamdown
- [x] 7.3 Update `ArkMessage` router to map ARK event kinds to new ai-elements components
- [x] 7.4 Verify debug panel cross-linking still works end-to-end (click chat message → JSON viewer shows raw data)
- [ ] 7.5 Test with a live agent: multi-turn conversation, streaming text, tool calls, thoughts, input requests
