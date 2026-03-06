## ADDED Requirements

### Requirement: React 19 SPA entry point
The system SHALL render the application as a React 19 SPA mounted on a `#root` DOM element. The application SHALL be bundled by esbuild into a single `public/script.js` file served by the existing FastAPI backend.

#### Scenario: Application mounts successfully
- **WHEN** the browser loads `index.html` with the bundled script
- **THEN** React renders the full application inside the `#root` element

#### Scenario: Backend serves React SPA
- **WHEN** a user navigates to the root URL
- **THEN** the backend serves the same `index.html` template with the React bundle, requiring no backend code changes

### Requirement: Socket.IO connection provider
The system SHALL provide a React Context that manages the Socket.IO client lifecycle. The context SHALL create the socket on mount, expose emit/listen helpers, and clean up on unmount.

#### Scenario: Socket connects on app mount
- **WHEN** the application mounts
- **THEN** a Socket.IO client connection is established to the backend

#### Scenario: Socket disconnects on unmount
- **WHEN** the application unmounts or the browser tab closes
- **THEN** the Socket.IO client disconnects cleanly

#### Scenario: Components access socket via hook
- **WHEN** a component calls the `useSocket()` hook
- **THEN** it receives the socket instance, connection status, and emit helper

### Requirement: Agent connection provider
The system SHALL provide a React Context that manages the agent connection lifecycle: fetching the agent card (POST /agent-card), initializing the client (Socket.IO `initialize_client`), and tracking connection state.

#### Scenario: Agent card fetch
- **WHEN** the user submits an agent URL with optional auth headers
- **THEN** the system sends POST `/agent-card` with the URL and session ID, and stores the returned card and validation errors

#### Scenario: Client initialization
- **WHEN** the agent card is successfully fetched
- **THEN** the system emits `initialize_client` with the URL and custom headers, and listens for `client_initialized` to store transport and modality information

#### Scenario: Connection error handling
- **WHEN** the agent card fetch or client initialization fails
- **THEN** the system displays the error message and remains in disconnected state

### Requirement: Message list state management
The system SHALL maintain an ordered list of chat messages (user and agent). User messages are added on send. Agent messages are added on each `agent_response` Socket.IO event. The list SHALL reset when a new session is started.

#### Scenario: User sends a message
- **WHEN** the user submits a message via the chat input
- **THEN** the message is added to the list with role "user" and emitted via Socket.IO `send_message`

#### Scenario: Agent response received
- **WHEN** an `agent_response` event is received
- **THEN** the payload is appended to the message list with role "agent"

#### Scenario: New session clears messages
- **WHEN** the user clicks "New Session"
- **THEN** the message list is cleared and the context ID is reset

### Requirement: AI Elements component integration
The system SHALL use AI Elements compound components for chat rendering (Message, Conversation, PromptInput), code display (CodeBlock, Terminal), and agent display (Agent). Components SHALL be copied into the project via the AI Elements CLI and customized as needed.

#### Scenario: Chat messages render via AI Elements Message
- **WHEN** a message is displayed in the chat
- **THEN** it uses the AI Elements Message component with MessageContent, MessageResponse (for markdown), and MessageActions

#### Scenario: Agent card renders via AI Elements Agent
- **WHEN** an agent card is successfully fetched
- **THEN** it displays using the AI Elements Agent component showing name, skills, and modalities

### Requirement: Dark mode with theme persistence
The system SHALL support dark and light themes via a toggle in the header. Theme preference SHALL persist in localStorage. The theme SHALL apply via CSS class on the document body, compatible with AI Elements and Tailwind CSS variable theming.

#### Scenario: Theme toggle
- **WHEN** the user clicks the theme toggle
- **THEN** the theme switches between dark and light mode and the preference is saved to localStorage

#### Scenario: Theme persistence on reload
- **WHEN** the application loads
- **THEN** it reads the saved theme from localStorage and applies it before first render

### Requirement: Authentication panel
The system SHALL provide an auth configuration panel supporting four auth types: None, Basic Auth, Bearer Token, and API Key. Selected auth type and credentials SHALL be included as custom headers in agent card fetch and client initialization requests.

#### Scenario: Basic auth selected
- **WHEN** the user selects Basic Auth and enters username/password
- **THEN** the system includes an `Authorization: Basic <base64>` header in requests

#### Scenario: Bearer token selected
- **WHEN** the user selects Bearer Token and enters a token
- **THEN** the system includes an `Authorization: Bearer <token>` header in requests

#### Scenario: API key selected
- **WHEN** the user selects API Key and enters a key name and value
- **THEN** the system includes the key as a custom header in requests

### Requirement: File attachment support
The system SHALL allow users to attach files to messages. Files SHALL be validated against the agent's supported input modes (MIME types), base64-encoded, and included in the `send_message` payload. Attached images SHALL show thumbnail previews.

#### Scenario: File attached to message
- **WHEN** the user selects a file via the attachment button or drag-and-drop
- **THEN** the file is validated against supported input modes, base64-encoded, and shown as a preview chip

#### Scenario: Unsupported file type
- **WHEN** the user attaches a file with a MIME type not in the agent's supported input modes
- **THEN** the system rejects the file and displays an error message

### Requirement: Session management with context tracking
The system SHALL track the A2A context ID across messages in a session. The context ID received from the first agent response SHALL be used in subsequent messages. A "New Session" button SHALL reset the context ID, clear the chat, and clear the ARK state.

#### Scenario: Context ID tracking
- **WHEN** an agent response includes a context ID
- **THEN** the system stores it and includes it in subsequent `send_message` events

#### Scenario: New session reset
- **WHEN** the user clicks "New Session"
- **THEN** the context ID is cleared, the message list is emptied, and the ARK state store is reset
