## Why

The current A2A Inspector frontend is a 1243-line vanilla TypeScript file with manual DOM manipulation, no component model, and closure-scoped state. It treats all A2A responses as opaque JSON blobs, missing the opportunity to render rich interactions when agents use structured DataPart payloads like those defined by the ARK extension (tool calls, reasoning, input requests, streaming text). A React-based frontend using AI Elements (Vercel's AI component library) would provide composable, purpose-built components for these patterns while making the codebase maintainable.

## What Changes

- **BREAKING**: Replace the entire `frontend/` directory with a React 19 SPA
- Adopt AI Elements (copied into project via `npx ai-elements`) for chat, code, and debug UI components
- Add ARK extension awareness: detect, parse, and render ARK envelopes (`tool-call`, `thought`, `text-stream`, `input-request`, `input-response`) as rich UI
- Introduce React Context providers for Socket.IO connection, agent state, and ARK event accumulation
- Replace the monolithic `script.ts` with ~20 focused component files
- Replace hand-written CSS (1297 lines) with Tailwind CSS 4 + AI Elements built-in theming
- Keep esbuild as the bundler — same build pipeline shape, same output location (`public/script.js`)
- **No backend changes** — the Python FastAPI backend is untouched; new frontend consumes the same REST + Socket.IO API
- Add `a2a-extension-ark` TypeScript SDK as a dependency for ARK type definitions and validation

## Capabilities

### New Capabilities

- `ark-event-rendering`: Detect and render ARK extension envelopes within A2A DataParts as rich UI components (tool call lifecycle, chain-of-thought reasoning, streaming text, input request/response flows)
- `react-component-architecture`: React 19 SPA with AI Elements compound components, Context-based state management, and composable provider hierarchy replacing vanilla DOM manipulation
- `debug-inspection-panel`: Tabbed debug view with syntax-highlighted JSON traffic log, per-message validation display, and raw JSON viewer using AI Elements Code components

### Modified Capabilities

_(none — no existing specs)_

## Impact

- **Frontend code**: Complete replacement of `frontend/src/` and `frontend/public/` contents
- **Dependencies**: New npm dependencies — `react`, `react-dom`, `tailwindcss`, `a2a-extension-ark`, plus shadcn/ui primitives pulled in by AI Elements components (Radix UI, Framer Motion, Shiki, etc.)
- **Build**: Same esbuild pipeline but with JSX transform enabled; Tailwind CSS build step added
- **Tests**: Existing frontend Vitest tests replaced with React Testing Library equivalents
- **Docker**: Frontend build stage updated for new dependencies (React, Tailwind) — same multi-stage pattern
- **Backend**: Zero changes — `app.py`, `validators.py`, Socket.IO events, REST endpoints all unchanged
