## Context

The A2A Inspector is a web-based developer tool for testing and debugging A2A (Agent-to-Agent) protocol servers. Its frontend is built with vanilla HTML, CSS, and TypeScript compiled via esbuild. The chat interface uses direct DOM manipulation to render message bubbles, file attachments, debug logs, and raw JSON modals. The backend (FastAPI + Socket.IO) streams A2A protocol events to the frontend, including multiple response types: `status-update` (often containing tool call data), `artifact-update`, `task` state transitions, and `message` responses.

The AI Elements library (at elements.ai-sdk.dev) provides a comprehensive set of React-based, composable UI components specifically designed for AI chat interfaces, built on shadcn/ui and Radix UI. These components handle exactly the kinds of data the A2A Inspector needs to visualize — tool calls, tasks, reasoning steps, code blocks, file attachments, and rich message rendering.

The backend Socket.IO event interface (`agent_response`, `debug_log`, `client_initialized`) remains unchanged.

## Goals / Non-Goals

**Goals:**
- Migrate the frontend from vanilla HTML/TS to React with AI Elements components
- Provide rich, interactive visualization of all A2A response types (status-updates, artifact-updates, task transitions, messages)
- Improve the chat input experience with auto-resize, drag-and-drop file upload, and keyboard shortcuts
- Maintain full feature parity with the current UI (connection, auth, agent card, chat, debug console, raw JSON inspection)
- Preserve the existing Socket.IO event interface — zero backend changes
- Support light/dark mode theming via Tailwind CSS + shadcn/ui design tokens

**Non-Goals:**
- Changing the backend Python code or Socket.IO protocol
- Adding new A2A protocol features or validation rules
- Building a mobile-optimized responsive layout (desktop-first, reasonable responsiveness only)
- Implementing real-time collaborative features
- Adding user accounts or session persistence

## Decisions

### 1. React + Vite as the frontend framework and build tool

**Decision**: Migrate from vanilla TypeScript + esbuild to React + Vite.

**Rationale**: AI Elements are React components requiring JSX and the React runtime. Vite provides fast HMR, native TypeScript/JSX support, and a production build optimized for modern browsers. esbuild alone cannot handle JSX or React component composition.

**Alternatives considered**:
- *Next.js*: Overkill for a single-page tool served by a Python backend. Would require rearchitecting the backend serving.
- *Preact*: Smaller but AI Elements target React specifically and may use React-specific APIs.
- *Web Components wrapper*: Would add a translation layer with no benefit and potential compatibility issues.

### 2. Map A2A response types to AI Elements components

**Decision**: Create a mapping layer that translates A2A protocol response events into AI Elements component props.

| A2A Event Kind | AI Elements Component | Rendering |
|---|---|---|
| `message` (role: agent, text parts) | `Message` + `MessageResponse` | Markdown-rendered agent response with message actions |
| `message` (role: user) | `Message` + `MessageContent` | User message bubble with attachment badges |
| `status-update` (tool call pattern) | `Tool` + `ToolHeader`/`ToolInput`/`ToolOutput` | Collapsible tool call with JSON input, state badge, and output |
| `status-update` (thinking/progress) | `Reasoning` | Collapsible thinking block with streaming support |
| `artifact-update` | `Artifact` + `ArtifactContent` | Structured container with header, content (text/file/data), and actions |
| `task` (state transitions) | `Task` + `TaskItem` | Collapsible task list with status indicators (working/completed/failed) |
| File parts (image/audio/video) | `Attachments` (inline variant) | Media preview with hover card |
| Data parts (JSON) | `CodeBlock` | Syntax-highlighted JSON with copy button |

**Rationale**: Each A2A response type maps naturally to an AI Elements component designed for that exact use case. Tool calls with `[Tool: Read]` JSON become `Tool` components. Task state transitions become `Task` items. This provides significantly richer visualization than the current "kind chip + text bubble" approach.

### 3. Socket.IO integration via custom React hooks

**Decision**: Create custom React hooks (`useA2ASocket`, `useA2AChat`, `useA2ADebugLog`) that wrap Socket.IO event handling and expose state to React components.

**Rationale**: React's state management (useState/useReducer) is the natural way to drive AI Elements re-renders. Custom hooks encapsulate the Socket.IO lifecycle (connect, disconnect, event listeners) and provide clean interfaces for components. This replaces the current imperative DOM manipulation with declarative React rendering.

**Alternatives considered**:
- *Redux/Zustand*: External state management adds complexity for what is fundamentally a linear chat state. React's built-in state with hooks suffices.
- *Direct Socket.IO in components*: Would scatter Socket.IO logic across components instead of centralizing it.

### 4. Tailwind CSS + shadcn/ui for styling

**Decision**: Replace the custom CSS variables system with Tailwind CSS utility classes and shadcn/ui design tokens.

**Rationale**: AI Elements are built on shadcn/ui which uses Tailwind. Using the same design system ensures visual consistency between AI Elements components and custom UI (connection panel, agent card section). Dark mode is handled via Tailwind's `dark:` variant and CSS custom properties that shadcn/ui already defines.

### 5. Keep the debug console as a custom component

**Decision**: The debug console remains a custom component but uses AI Elements `CodeBlock` for JSON rendering within log entries.

**Rationale**: There is no AI Elements equivalent for a "debug console" — it's application-specific. However, replacing the current manual JSON formatting and `json-highlight` class with `CodeBlock` provides syntax highlighting, copy-to-clipboard, and theme-aware rendering for free.

### 6. Component architecture

**Decision**: Structure the React app as:

```
App
├── ConnectionPanel (URL input, auth, headers, connect button)
├── AgentCardPanel (collapsible agent card JSON + validation)
├── ChatPanel
│   ├── Conversation (AI Elements wrapper)
│   │   ├── ConversationContent
│   │   │   ├── Message (user) + MessageAttachments
│   │   │   ├── Message (agent) + MessageResponse
│   │   │   ├── Tool (for tool-call status-updates)
│   │   │   ├── Reasoning (for progress status-updates)
│   │   │   ├── Task (for task state transitions)
│   │   │   └── Artifact (for artifact-updates)
│   │   └── ConversationScrollButton
│   ├── PromptInput (with attachments, metadata, send)
│   └── SessionDetails (transport, modalities, context ID)
└── DebugConsole (slide-up panel with CodeBlock entries)
```

## Risks / Trade-offs

- **[Bundle size increase]** → React + Tailwind + AI Elements will significantly increase the JS/CSS bundle compared to the current ~50KB vanilla setup. Mitigation: Vite's tree-shaking and code splitting will eliminate unused components. The inspector is a developer tool, not a consumer app, so bundle size is less critical.

- **[Migration complexity]** → Converting ~1200 lines of imperative DOM code to React components is a substantial rewrite. Mitigation: The Socket.IO event interface is unchanged, so the rewrite is purely frontend. Implement incrementally by component area.

- **[AI Elements version stability]** → AI Elements is a newer library; APIs may change. Mitigation: Pin specific versions in package.json. The composable architecture means individual component updates can be isolated.

- **[Loss of zero-dependency simplicity]** → The current app has minimal dependencies. Adding React, Tailwind, shadcn/ui, and AI Elements introduces a significant dependency tree. Mitigation: These are widely-used, well-maintained libraries. The trade-off is justified by the dramatic UX improvement.

- **[A2A response parsing]** → The mapping from A2A event kinds to AI Elements components requires parsing event data to detect patterns (e.g., `[Tool: Read]` in text parts). Mitigation: Create a dedicated `parseA2AEvent` function with clear pattern matching and fallback to generic `Message` rendering for unrecognized formats.
