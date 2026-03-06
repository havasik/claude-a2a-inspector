## Context

The A2A Inspector is a web-based debugging tool with a Python FastAPI backend (Socket.IO for real-time comms) and a vanilla TypeScript frontend. The frontend is a single 1243-line file with manual DOM manipulation and closure-scoped state. It renders all agent responses as plain text or opaque JSON. The backend API surface (REST + Socket.IO events) is stable and will not change.

The ARK extension (`a2a-extension-ark`) defines structured schemas for A2A DataPart payloads: tool-call lifecycles, chain-of-thought reasoning, input request/response flows, and streaming text. AI Elements (`ai-elements`) is Vercel's React component library built on shadcn/ui, providing compound components for AI interfaces.

## Goals / Non-Goals

**Goals:**
- Replace the frontend with a React 19 SPA that renders ARK events as rich, interactive UI
- Use AI Elements for chat, code, and debug components — avoid rebuilding what exists
- Maintain the same backend API contract (zero backend changes)
- Keep esbuild as bundler — same build shape, same output location
- Preserve all current features: agent connection, chat, file attachments, debug console, dark mode, auth panel, session management

**Non-Goals:**
- Backend modifications (no Python changes)
- Server-side rendering or Next.js framework adoption (static SPA only)
- Voice components from AI Elements (no voice features in A2A Inspector)
- Workflow/canvas components from AI Elements (no node-based UI needed)
- Supporting ARK input-response flow end-to-end (requires backend changes to forward responses back to agent — deferred)

## Decisions

### 1. React SPA with esbuild, not Next.js

**Decision:** Build a React 19 SPA bundled by esbuild, served as static files by the existing FastAPI backend.

**Alternatives considered:**
- **Next.js**: Adds SSR, file-system routing, API routes — none needed. Would require rearchitecting how the backend serves the frontend. Massive dependency footprint.
- **Vite**: Good React DX but adds another tool. esbuild is already in the project, proven to work, and fast enough.

**Rationale:** The backend already serves static files from `frontend/public/`. Keeping esbuild means the build output drops into the same location. Zero backend changes. The only esbuild addition is `--jsx=automatic` for React JSX transform.

### 2. AI Elements via shadcn/ui copy-in pattern

**Decision:** Copy AI Elements components into `src/components/ai-elements/` using `npx ai-elements add <component>`. Components become owned source code.

**Alternatives considered:**
- **Install as npm dependency**: AI Elements doesn't ship as a traditional library — it follows shadcn/ui's copy model by design.
- **Build from scratch**: Would mean rebuilding streaming markdown, syntax highlighting, compound component patterns. Months of work for no gain.

**Rationale:** shadcn/ui pattern means we own the code and can customize freely. AI Elements handles the hard parts (Streamdown for streaming markdown, Shiki for syntax highlighting, compound component composition). Components we copy in: Message, Conversation, PromptInput, Reasoning, ChainOfThought, Tool, Confirmation, CodeBlock, Terminal, Shimmer, Attachments, Agent, Suggestion.

### 3. Tailwind CSS 4 with CSS Variables for theming

**Decision:** Replace hand-written CSS with Tailwind CSS 4 in CSS Variables mode.

**Alternatives considered:**
- **Keep vanilla CSS**: Incompatible with AI Elements which depends on Tailwind + CSS variables.
- **CSS Modules**: Would conflict with AI Elements' Tailwind-based styling.

**Rationale:** AI Elements requires Tailwind CSS with CSS Variables mode. This also gives us dark mode for free via `body.dark-mode` class overriding CSS variables — same mechanism as the current implementation, just standardized.

### 4. React Context for state management, not Zustand/Redux

**Decision:** Use React Context + `useReducer` for three provider layers: SocketProvider, AgentConnectionProvider, ArkStateProvider.

**Alternatives considered:**
- **Zustand**: Lighter than Redux but adds a dependency for what amounts to three small stores.
- **Redux Toolkit**: Overkill for this app's state complexity.
- **Jotai/Signals**: Good primitives but AI Elements patterns assume standard React Context.

**Rationale:** Three contexts with clear boundaries is simple and sufficient. The ARK state accumulator is the most complex piece (a reducer that merges streaming events by ID), and `useReducer` handles it cleanly.

### 5. ARK detection at the frontend, not backend

**Decision:** The frontend inspects `agent_response` payloads for ARK envelopes in DataParts. The backend passes everything through unchanged.

**Alternatives considered:**
- **Backend parses ARK and emits typed events**: Would require backend changes (out of scope) and would lose the raw inspection capability.

**Rationale:** The backend is frozen. The frontend receives the same `agent_response` events and checks for `data.ark` within DataPart responses. If found, routes to ARK-aware components. If not, renders as plain messages. This is graceful degradation — non-ARK agents work identically to today.

### 6. Split-pane layout: Rich view + Debug view

**Decision:** Side-by-side resizable panels — left for rich chat rendering, right for debug inspection (traffic log, validation, raw JSON tabs).

**Alternatives considered:**
- **Overlay debug console** (current): Works but limits visibility. Can't see chat and debug simultaneously without resizing.
- **Separate pages/tabs**: Loses the correlation between a chat message and its debug trace.

**Rationale:** The inspector's core value is seeing both the rendered result AND the underlying protocol. Side-by-side makes this natural. AI Elements' Terminal and CodeBlock components fit the debug panel perfectly.

## Risks / Trade-offs

**[AI Elements dependency depth]** → AI Elements pulls in Radix UI, Framer Motion, Shiki, Streamdown, and other transitive deps. This increases the bundle size significantly vs vanilla TS.
→ **Mitigation:** esbuild tree-shakes unused code. Only copy in components we actually use. Monitor bundle size.

**[AI Elements assumes Next.js/React 19]** → Some components may use React 19 features (no forwardRef) or assume Next.js patterns.
→ **Mitigation:** Since we copy components as source, we can patch any Next.js-specific imports. React 19 is used directly.

**[Tailwind build step]** → Adds a CSS build step that doesn't exist today.
→ **Mitigation:** Tailwind 4 has a standalone CLI that outputs a single CSS file. Add to the existing build script alongside esbuild.

**[ARK input-response is display-only]** → Without backend changes, the frontend can render input-request UIs but cannot send input-response back to the agent.
→ **Mitigation:** Render the input UI as read-only/informational in v1. Show what the agent asked but don't enable responding. Document as a future enhancement requiring backend work.

**[Full frontend rewrite risk]** → Replacing the entire frontend is a large change with regression potential.
→ **Mitigation:** Feature parity checklist against current capabilities. Existing backend tests validate the API contract. New frontend tests cover component rendering. The old frontend exists in git history if rollback is needed.
