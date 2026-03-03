## 1. Build System & Dependencies Setup

- [x] 1.1 Initialize Vite + React + TypeScript project in `frontend/` (add `vite.config.ts`, update `tsconfig.json`, configure JSX support)
- [x] 1.2 Install core dependencies: `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`, `shadcn/ui`, `socket.io-client`, `marked`, `dompurify`
- [x] 1.3 Install AI Elements packages for Message, Conversation, PromptInput, Tool, Task, Artifact, Reasoning, Attachments, CodeBlock, Shimmer components
- [x] 1.4 Configure Tailwind CSS with shadcn/ui design tokens and light/dark mode CSS variables
- [x] 1.5 Update `index.html` to a minimal React shell with `<div id="root">` mount point and remove all existing inline HTML structure
- [x] 1.6 Create React entry point (`main.tsx`) that renders `<App />` into `#root`
- [x] 1.7 Update `backend/app.py` static file serving to point to Vite build output directory
- [x] 1.8 Update `scripts/run.sh` to include Vite dev server alongside the Python backend
- [x] 1.9 Remove esbuild configuration and old build scripts from `package.json`

## 2. Core React App Structure & Socket.IO Hooks

- [x] 2.1 Create `useA2ASocket` hook: manage Socket.IO connection lifecycle (connect, disconnect, event listener setup/teardown)
- [x] 2.2 Create `useA2AChat` hook: manage chat state (messages array, contextId, isConnected), expose `sendMessage` and `resetSession` actions
- [x] 2.3 Create `useA2ADebugLog` hook: manage debug log entries array with 500-entry pruning, expose `addLog` and `clearLogs` actions
- [x] 2.4 Create `useA2AConnection` hook: manage agent card fetching, client initialization, auth headers, transport/modalities state
- [x] 2.5 Create `useTheme` hook: manage light/dark mode toggle with localStorage persistence
- [x] 2.6 Create `App` component with top-level layout: ConnectionPanel, AgentCardPanel, ChatPanel, DebugConsole

## 3. Connection Panel & Agent Card

- [x] 3.1 Build `ConnectionPanel` component: URL input, connect button, collapsible auth section (None/Basic/Bearer/API Key), custom headers key-value list
- [x] 3.2 Build `AgentCardPanel` component: collapsible section showing agent card JSON via `CodeBlock` with validation results (valid checkmark or error list)
- [x] 3.3 Wire ConnectionPanel to `useA2AConnection` hook for agent card fetching and client initialization via Socket.IO

## 4. Chat Interface (ai-chat-interface spec)

- [x] 4.1 Build `ChatPanel` component wrapping AI Elements `Conversation` with `ConversationContent`, `ConversationScrollButton`, and `ConversationEmptyState`
- [x] 4.2 Build `ChatMessage` component: render user messages with `Message from="user"` + `MessageContent` and agent messages with `Message from="assistant"` + `MessageResponse`
- [x] 4.3 Add `MessageActions` with copy-to-clipboard action on agent messages
- [x] 4.4 Add validation status indicators on agent messages (green checkmark for valid, orange warning with tooltip for invalid)
- [x] 4.5 Add click-to-inspect functionality: clicking any message opens a raw JSON modal using `CodeBlock`
- [x] 4.6 Build `ChatInput` component using AI Elements `PromptInput` with `PromptInputTextarea`, `PromptInputFooter`, `PromptInputSubmit`, and attachment button
- [x] 4.7 Build `SessionDetails` component: collapsible section showing transport protocol badge, input/output modality tags, and context ID
- [x] 4.8 Add `ThemeToggle` component in the header for light/dark mode switching
- [x] 4.9 Wire ChatPanel to `useA2AChat` hook for sending messages and receiving responses

## 5. A2A Data Visualization (a2a-data-visualization spec)

- [x] 5.1 Create `parseA2AEvent` utility: detect A2A event kind and sub-type (tool call pattern, progress text, task state, artifact, message, error) and return a typed discriminated union
- [x] 5.2 Build `ToolCallView` component: render `status-update` tool calls using AI Elements `Tool` + `ToolHeader` + `ToolInput` + `ToolOutput` with state badges (running/completed)
- [x] 5.3 Build `ReasoningView` component: render non-tool `status-update` progress messages using AI Elements `Reasoning` with auto-open during streaming and auto-close on final response
- [x] 5.4 Build `TaskView` component: render `task` events using AI Elements `Task` + `TaskItem` with status icons (in-progress, completed, failed) and artifact entries
- [x] 5.5 Build `ArtifactView` component: render `artifact-update` events using AI Elements `Artifact` + `ArtifactContent` with text (Markdown), file (media embed), and data (CodeBlock) parts
- [x] 5.6 Build `ErrorView` component: render error responses with red-tinted styling and error icon
- [x] 5.7 Build `MultimediaRenderer` component: render image/audio/video file parts inline with appropriate media elements
- [x] 5.8 Add A2A kind chips (small badges) alongside specialized component renders for protocol-level visibility
- [x] 5.9 Integrate all visualization components into `ChatPanel` message rendering pipeline via `parseA2AEvent` dispatcher

## 6. Enhanced Attachments (enhanced-attachments spec)

- [x] 6.1 Integrate AI Elements `Attachments` component in `PromptInput` header area with `grid` variant for pending file previews
- [x] 6.2 Add `AttachmentPreview`, `AttachmentInfo`, and `AttachmentRemove` sub-components for each attached file
- [x] 6.3 Enable drag-and-drop file upload via `PromptInput`'s `globalDrop` prop
- [x] 6.4 Implement file type validation against connected agent's `supportedInputModes` with error feedback for unsupported types
- [x] 6.5 Render sent message attachments as `inline` variant `Attachments` within `MessageAttachments`

## 7. Enhanced Debug Console (enhanced-debug-console spec)

- [x] 7.1 Build `DebugConsole` component: fixed-position slide-up panel with draggable resize handle and show/hide toggle
- [x] 7.2 Render each debug log entry with `CodeBlock` for JSON content, colored labels (Request=blue, Response=gray, Error=red, Validation=yellow), and timestamps
- [x] 7.3 Add clear button functionality to empty all log entries and reset internal store
- [x] 7.4 Implement 500-entry log pruning (remove oldest entries automatically)
- [x] 7.5 Wire DebugConsole to `useA2ADebugLog` hook for real-time log updates

## 8. Testing & Cleanup

- [x] 8.1 Migrate existing frontend tests from vanilla DOM testing to React Testing Library + Vitest
- [x] 8.2 Add tests for `parseA2AEvent` utility covering all A2A response kinds and edge cases
- [ ] 8.3 Add component tests for ChatMessage rendering (user vs agent, with/without validation errors)
- [ ] 8.4 Add component tests for ToolCallView, TaskView, ArtifactView with sample A2A data
- [x] 8.5 Verify all existing backend tests still pass (no backend changes expected)
- [x] 8.6 Remove old vanilla TypeScript source (`frontend/src/script.ts`), compiled JS (`frontend/public/script.js`), and old CSS (`frontend/public/styles.css`)
- [x] 8.7 Update Dockerfile to use Vite build output instead of esbuild
