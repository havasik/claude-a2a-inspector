## ADDED Requirements

### Requirement: Streaming text uses Streamdown incremental markdown
ARK `text-stream` events SHALL render using Streamdown-based incremental markdown parsing via the ai-elements `MessageResponse` component. The parser SHALL NOT re-parse the entire accumulated text on each new chunk.

#### Scenario: Chunks render incrementally
- **WHEN** a text-stream ARK event delivers chunks sequentially ("Hello", " **world**", " how are you?")
- **THEN** each chunk is incrementally parsed and rendered without re-processing previous chunks, maintaining smooth visual flow

#### Scenario: Markdown formatting resolves as tokens complete
- **WHEN** streaming text contains partial markdown tokens (e.g., `**bol` then `d**`)
- **THEN** the text renders as plain text while the token is incomplete and resolves to formatted text once the token closes

### Requirement: Completed text renders as full markdown
When a `text-stream` ARK event reaches status `done`, the content SHALL render as fully parsed markdown with proper formatting, code blocks, lists, and links.

#### Scenario: Completed stream shows rich markdown
- **WHEN** a text-stream event transitions to status `done`
- **THEN** the full assembled text renders with all markdown formatting applied (headings, bold, italic, code blocks, lists, links)

### Requirement: Non-ARK agent messages render with markdown
Agent messages that do not contain ARK envelopes SHALL still render with markdown formatting via the `MessageResponse` component, not raw text.

#### Scenario: Plain agent message renders markdown
- **WHEN** an agent response has no ARK parts but contains markdown text
- **THEN** the text renders with full markdown formatting through the `MessageResponse` component

### Requirement: Streaming indicator shows during active generation
While an agent is actively streaming a response (text-stream status is `streaming`), a visual streaming indicator SHALL be displayed.

#### Scenario: Shimmer shows at stream start
- **WHEN** the first chunk of a text-stream arrives
- **THEN** a `Shimmer` or cursor indicator shows alongside the accumulating text

#### Scenario: Indicator disappears when stream completes
- **WHEN** a text-stream event reaches status `done`
- **THEN** the streaming indicator is removed and only the final rendered markdown remains

### Requirement: Message appearance is animated
New messages entering the chat SHALL animate into view rather than appearing abruptly.

#### Scenario: Agent message animates in
- **WHEN** a new agent message appears in the chat
- **THEN** it animates into view with a smooth entrance transition (e.g., fade-in, slide-up)

#### Scenario: User message animates in
- **WHEN** the user sends a message
- **THEN** the message bubble animates into the chat with a smooth entrance transition
