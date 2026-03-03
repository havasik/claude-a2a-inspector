## Why

The A2A Inspector's current UI is built with vanilla HTML/CSS/TypeScript, resulting in a functional but visually basic interface that lacks the polished, interactive feel expected of modern AI developer tools. The chat interface treats all A2A response types (status-updates, artifact-updates, tool calls, task state transitions) with minimal visual differentiation — simple message bubbles with small "kind chips." File attachments, streaming progress, and debug data all use rudimentary rendering. Adopting the AI Elements component library (built on shadcn/ui) would bring composable, purpose-built AI chat components that handle these data types with rich, interactive visualizations out of the box, significantly improving developer experience when inspecting and debugging A2A protocol interactions.

## What Changes

- **Replace the chat message rendering** with AI Elements `Message`, `MessageContent`, and `MessageResponse` components that provide proper Markdown rendering, role-based styling, and message action buttons (copy, retry)
- **Replace the text input area** with AI Elements `PromptInput` component, gaining auto-resize textarea, drag-and-drop file upload, keyboard shortcuts, and composable toolbar
- **Introduce rich A2A data type visualization**:
  - `Tool` component for rendering A2A status-updates that contain tool calls (e.g., `[Tool: Read]` with JSON parameters) as collapsible, state-aware panels
  - `Task` component for rendering A2A task state transitions (working → completed) with visual progress indicators
  - `Artifact` component for rendering A2A artifact-updates as structured content containers with headers and actions
  - `Reasoning`/`ChainOfThought` component for rendering agent "thinking" steps and intermediate status messages
- **Replace file attachment UI** with AI Elements `Attachments` component supporting grid/inline/list variants, media previews, hover cards, and proper remove buttons
- **Enhance the debug console** with `CodeBlock` component for syntax-highlighted JSON with copy-to-clipboard and line numbers
- **Add loading states** with `Shimmer` component for streaming responses instead of the current spinner
- **Wrap chat in `Conversation` component** for auto-scroll behavior, scroll-to-bottom button, and empty state display
- **Modernize the overall layout** with a cleaner visual design leveraging shadcn/ui design tokens for consistent theming (light/dark mode)
- **Replace raw JSON modal** with `CodeBlock`-based display for better readability and interaction

## Capabilities

### New Capabilities
- `ai-chat-interface`: Rich chat message rendering with AI Elements Message, Conversation, and PromptInput components, replacing the current vanilla HTML chat
- `a2a-data-visualization`: Interactive visualization of A2A protocol data types (status-updates with tool calls, task state transitions, artifact-updates) using Tool, Task, Artifact, and Reasoning components
- `enhanced-attachments`: File attachment handling with AI Elements Attachments component supporting grid/inline/list layouts, media previews, and drag-and-drop
- `enhanced-debug-console`: Debug console with CodeBlock-based syntax-highlighted JSON, copy-to-clipboard, and improved log entry rendering

### Modified Capabilities

## Impact

- **Frontend code**: Major rewrite of `frontend/src/script.ts` — migrating from vanilla DOM manipulation to component-based rendering using AI Elements
- **Frontend dependencies**: Add `@anthropic-ai/ai-elements` (or equivalent packages for Message, PromptInput, Tool, Task, Attachments, CodeBlock, Conversation, Shimmer, Reasoning, Artifact components), `shadcn/ui`, and their peer dependencies (React, Radix UI, Tailwind CSS)
- **Build system**: Migrate from esbuild to a React-compatible build pipeline (Vite with React plugin), since AI Elements are React components
- **HTML template**: `frontend/public/index.html` will be restructured as a React app mount point
- **CSS**: Migrate from custom CSS variables to Tailwind CSS + shadcn/ui design tokens while preserving light/dark mode theming
- **Backend**: No changes to `backend/app.py` or `backend/validators.py` — Socket.IO event interface remains the same
- **Testing**: Frontend tests will need migration from vanilla DOM testing to React Testing Library
