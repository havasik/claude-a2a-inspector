## 1. Project Scaffold & Build Setup

- [ ] 1.1 Update `frontend/package.json` with React 19, react-dom, tailwindcss 4, a2a-extension-ark, and dev deps (esbuild, vitest, @testing-library/react, jsdom)
- [ ] 1.2 Update `frontend/tsconfig.json` for JSX support (`jsx: "react-jsx"`, `moduleResolution: "bundler"`)
- [ ] 1.3 Create `frontend/src/styles/globals.css` with Tailwind directives and CSS variable theme definitions (light + dark mode)
- [ ] 1.4 Update esbuild build script in package.json to add `--jsx=automatic` and Tailwind CSS build step
- [ ] 1.5 Replace `frontend/public/index.html` with minimal React mount point (`<div id="root">`) and link to built CSS/JS
- [ ] 1.6 Install AI Elements components via `npx ai-elements add`: message, conversation, prompt-input, reasoning, chain-of-thought, tool, confirmation, code-block, terminal, shimmer, attachments, agent, suggestion
- [ ] 1.7 Install shadcn/ui dependencies pulled in by AI Elements (Radix UI primitives, Framer Motion, Shiki, Streamdown, marked, dompurify)

## 2. React App Shell & Providers

- [ ] 2.1 Create `frontend/src/app.tsx` — React 19 entry point with `createRoot` mounting on `#root`, wrapping providers
- [ ] 2.2 Create `frontend/src/providers/socket-provider.tsx` — SocketProvider context with Socket.IO client lifecycle, `useSocket()` hook exposing socket, isConnected, emit helper
- [ ] 2.3 Create `frontend/src/providers/agent-connection-provider.tsx` — AgentConnectionProvider context managing card fetch (POST /agent-card), client init (initialize_client event), connection state, transport/modality info, `useAgentConnection()` hook
- [ ] 2.4 Create `frontend/src/providers/ark-state-provider.tsx` — ArkStateProvider context with `useReducer` for ARK event accumulation (replace/append by kind), reset on new session, `useArkState()` hook
- [ ] 2.5 Create `frontend/src/providers/theme-provider.tsx` — ThemeProvider with localStorage persistence, body class toggle, `useTheme()` hook

## 3. Shared Types & Utilities

- [ ] 3.1 Create `frontend/src/lib/types.ts` — TypeScript types for agent_response payloads, debug_log events, agent card, connection state, message list entries
- [ ] 3.2 Create `frontend/src/lib/ark-parser.ts` — `extractArkParts()` and `extractPlainParts()` functions that inspect agent_response DataParts for ARK envelopes
- [ ] 3.3 Create `frontend/src/lib/utils.ts` — Shared utilities (cn classname helper, formatFileSize, generateMessageId)

## 4. Layout Components

- [ ] 4.1 Create `frontend/src/components/layout/header.tsx` — App header with title "A2A Inspector" and theme toggle
- [ ] 4.2 Create `frontend/src/components/layout/split-pane.tsx` — Resizable side-by-side panels (chat left, debug right) with draggable divider
- [ ] 4.3 Create `frontend/src/components/layout/session-bar.tsx` — Bottom bar showing transport type, context ID, input/output modalities, ARK status

## 5. Connection Components

- [ ] 5.1 Create `frontend/src/components/connection/connection-bar.tsx` — URL input field with connect/disconnect button, wired to AgentConnectionProvider
- [ ] 5.2 Create `frontend/src/components/connection/auth-panel.tsx` — Collapsible auth config: None, Basic Auth, Bearer Token, API Key with custom headers input
- [ ] 5.3 Create `frontend/src/components/connection/agent-card-display.tsx` — Render fetched agent card using AI Elements Agent component (name, skills, modalities), show validation errors if any

## 6. Chat Components

- [ ] 6.1 Create `frontend/src/hooks/use-messages.ts` — useMessages hook managing ordered message list, addUserMessage, addAgentResponse, reset
- [ ] 6.2 Create `frontend/src/components/chat/chat-panel.tsx` — Wraps AI Elements Conversation with ConversationContent, ConversationScrollButton, and ConversationEmptyState
- [ ] 6.3 Create `frontend/src/components/chat/message-list.tsx` — Maps messages array to either ArkMessage or plain AI Elements Message components based on ARK detection
- [ ] 6.4 Create `frontend/src/components/chat/chat-input.tsx` — Wraps AI Elements PromptInput with textarea, attachment button, submit button; emits send_message on submit with contextId and metadata

## 7. ARK Event Rendering Components

- [ ] 7.1 Create `frontend/src/components/ark/ark-message.tsx` — Router component that inspects ARK parts and delegates to kind-specific renderers; falls back to CodeBlock for unknown kinds
- [ ] 7.2 Create `frontend/src/components/ark/ark-tool-call.tsx` — Wraps AI Elements Tool component; maps ARK tool-call states (pending/working/completed/failed) to Tool state props; shows name, arguments, result/error
- [ ] 7.3 Create `frontend/src/components/ark/ark-thought.tsx` — Wraps AI Elements Reasoning (for streaming) and ChainOfThought (for complete thoughts); handles step numbers and progressive text assembly
- [ ] 7.4 Create `frontend/src/components/ark/ark-text-stream.tsx` — Uses AI Elements Shimmer during streaming, transitions to MessageResponse when done; reads assembled text from ARK state
- [ ] 7.5 Create `frontend/src/components/ark/ark-input-request.tsx` — Renders display-only UI per type: Confirmation (AI Elements Confirmation with disabled buttons), Select (radio group), MultiSelect (checkbox group), FreeText (disabled input)

## 8. Debug Panel Components

- [ ] 8.1 Create `frontend/src/hooks/use-debug-log.ts` — useDebugLog hook managing debug_log events, 500-entry cap with FIFO eviction
- [ ] 8.2 Create `frontend/src/components/debug/debug-panel.tsx` — Tabbed container with Traffic Log, Validation, Raw JSON tabs
- [ ] 8.3 Create `frontend/src/components/debug/traffic-log.tsx` — Uses AI Elements Terminal component to display debug_log events as syntax-highlighted JSON with type indicators and auto-scroll
- [ ] 8.4 Create `frontend/src/components/debug/validation-display.tsx` — Lists per-message validation status (pass/fail indicators) with error details for non-compliant responses
- [ ] 8.5 Create `frontend/src/components/debug/json-viewer.tsx` — Uses AI Elements CodeBlock to display selected message's raw JSON with syntax highlighting and line numbers

## 9. File Attachments

- [ ] 9.1 Create `frontend/src/hooks/use-attachments.ts` — useAttachments hook for file management: add (with MIME validation), remove, clear, base64 encode
- [ ] 9.2 Integrate attachment previews into chat-input using AI Elements Attachments component with image thumbnails and file chips

## 10. Wiring & Integration

- [ ] 10.1 Wire Socket.IO `agent_response` events through to useMessages (add to list) and useArkState (detect + accumulate ARK events)
- [ ] 10.2 Wire Socket.IO `debug_log` events through to useDebugLog
- [ ] 10.3 Wire message click in chat-panel to select message in json-viewer (Raw JSON tab)
- [ ] 10.4 Wire validation warning click on chat messages to switch debug panel to Validation tab
- [ ] 10.5 Wire "New Session" button to reset messages, ARK state, context ID, and debug log

## 11. Cleanup & Build Verification

- [ ] 11.1 Remove old `frontend/src/script.ts` and `frontend/src/lib/parseA2AEvent.ts`
- [ ] 11.2 Remove old `frontend/public/styles.css` (replaced by Tailwind output)
- [ ] 11.3 Update `frontend/public/script.js` build output via `npm run build` and verify it loads in browser
- [ ] 11.4 Update Dockerfile frontend build stage for new dependencies (React, Tailwind)
- [ ] 11.5 Update `scripts/run.sh` if build/watch commands changed

## 12. Testing

- [ ] 12.1 Create `frontend/tests/setup.ts` — Vitest setup with jsdom, React Testing Library, Socket.IO mock
- [ ] 12.2 Write tests for `ark-parser.ts` — ARK envelope detection, plain part extraction, unknown kind handling
- [ ] 12.3 Write tests for ARK state reducer — tool-call replace, text-stream append, thought accumulation, session reset
- [ ] 12.4 Write tests for ArkMessage component — routes tool-call, thought, text, text-stream, input-request to correct sub-components
- [ ] 12.5 Write tests for ArkToolCall component — renders all four states with correct badges
- [ ] 12.6 Write tests for connection flow — auth header generation for all four auth types
- [ ] 12.7 Write tests for chat flow — message send, agent response display, new session reset
- [ ] 12.8 Write tests for debug panel — log cap enforcement, validation display, message selection
- [ ] 12.9 Remove old test files (`frontend/tests/dark-mode.test.ts`, `auth.test.ts`, `ui-components.test.ts`, `session-management.test.ts`, `file-attachments.test.ts`)
