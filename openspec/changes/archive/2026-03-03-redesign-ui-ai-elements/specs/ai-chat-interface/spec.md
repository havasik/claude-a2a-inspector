## ADDED Requirements

### Requirement: Chat messages render with role-based styling
The system SHALL render user messages and agent messages with distinct visual styling using AI Elements `Message` component. User messages SHALL appear right-aligned with a secondary background. Agent messages SHALL appear left-aligned and full-width. The `from` prop SHALL be set to `"user"` or `"assistant"` based on the message role.

#### Scenario: User message is displayed
- **WHEN** a user sends a message
- **THEN** the message is rendered as a `Message` component with `from="user"`, right-aligned with secondary background styling

#### Scenario: Agent message is displayed
- **WHEN** an agent response of kind `message` is received with role `agent`
- **THEN** the message is rendered as a `Message` component with `from="assistant"`, left-aligned with full-width styling

### Requirement: Agent text responses render Markdown
The system SHALL render agent text responses using the AI Elements `MessageResponse` component, which provides GitHub Flavored Markdown rendering, KaTeX math equations, and automatic incomplete markdown parsing.

#### Scenario: Markdown content in agent response
- **WHEN** an agent response contains text with Markdown formatting (headings, lists, bold, code blocks)
- **THEN** the text is rendered as formatted HTML via `MessageResponse` with proper Markdown rendering

#### Scenario: Incomplete markdown during streaming
- **WHEN** an agent response arrives with an unclosed code block or incomplete syntax
- **THEN** `MessageResponse` with `parseIncompleteMarkdown=true` automatically fixes the broken syntax for display

### Requirement: Chat uses Conversation component for auto-scroll
The system SHALL wrap the chat message area in the AI Elements `Conversation` component. The conversation SHALL auto-scroll to the bottom when new messages arrive. A scroll-to-bottom button SHALL appear when the user scrolls away from the bottom.

#### Scenario: New message triggers auto-scroll
- **WHEN** a new message (user or agent) is added to the conversation
- **THEN** the conversation area smoothly scrolls to the bottom

#### Scenario: Scroll button appears when scrolled up
- **WHEN** the user scrolls up in the conversation
- **THEN** a `ConversationScrollButton` appears allowing one-click return to the bottom

### Requirement: Empty chat displays a welcome state
The system SHALL display a `ConversationEmptyState` when no messages have been exchanged yet, showing a title and description prompting the user to connect to an agent and start chatting.

#### Scenario: No messages in conversation
- **WHEN** the chat is first loaded or a new session is started with no messages
- **THEN** a `ConversationEmptyState` is displayed with a descriptive title and subtitle

### Requirement: Chat input uses PromptInput component
The system SHALL replace the current text input with the AI Elements `PromptInput` component providing auto-resize textarea, Enter-to-submit (Shift+Enter for newlines), and a composable toolbar.

#### Scenario: User types a message
- **WHEN** the user types text in the `PromptInputTextarea`
- **THEN** the textarea auto-resizes to fit the content

#### Scenario: User submits with Enter
- **WHEN** the user presses Enter without Shift
- **THEN** the message is submitted to the agent

#### Scenario: User adds a newline with Shift+Enter
- **WHEN** the user presses Shift+Enter
- **THEN** a newline is inserted in the textarea without submitting

### Requirement: Message actions are available on agent messages
The system SHALL render `MessageActions` on agent messages providing at minimum a "Copy" action button that copies the message text content to the clipboard.

#### Scenario: User copies an agent message
- **WHEN** the user clicks the "Copy" action on an agent message
- **THEN** the message text content is copied to the clipboard

### Requirement: Clicking a message shows raw JSON
The system SHALL preserve the ability to view the raw JSON of any message. Clicking a message SHALL open a modal displaying the raw A2A protocol JSON for that message using the `CodeBlock` component for syntax-highlighted rendering.

#### Scenario: User clicks on a chat message
- **WHEN** the user clicks on any message in the conversation
- **THEN** a modal opens showing the raw JSON-RPC data for that message, syntax-highlighted with `CodeBlock`

### Requirement: Validation status indicators on messages
The system SHALL display validation compliance indicators on agent messages. Valid messages SHALL show a green checkmark. Invalid messages SHALL show an orange warning icon with a tooltip listing validation errors.

#### Scenario: Valid agent message
- **WHEN** an agent response has no validation errors
- **THEN** a green checkmark indicator is displayed on the message

#### Scenario: Invalid agent message
- **WHEN** an agent response has one or more validation errors
- **THEN** an orange warning indicator is displayed with a tooltip listing all errors

### Requirement: React app mounts in existing HTML shell
The system SHALL render the React application into a root `div` element in `index.html`. The HTML file SHALL serve as a minimal shell with a `<div id="root">` mount point, with all UI rendered by React components.

#### Scenario: Application loads
- **WHEN** the page is loaded in a browser
- **THEN** React mounts into `#root` and renders the full inspector interface

### Requirement: Light and dark mode theming
The system SHALL support light and dark mode themes using Tailwind CSS `dark:` variant and shadcn/ui design tokens. A theme toggle SHALL switch between modes and the preference SHALL be persisted in localStorage.

#### Scenario: User toggles to dark mode
- **WHEN** the user clicks the theme toggle
- **THEN** the UI switches to dark mode with updated colors across all components and the preference is saved to localStorage

#### Scenario: Theme is restored on page load
- **WHEN** the page loads and a theme preference exists in localStorage
- **THEN** the saved theme is applied immediately
