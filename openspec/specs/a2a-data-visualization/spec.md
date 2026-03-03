## ADDED Requirements

### Requirement: Status-update tool calls render as Tool components
The system SHALL detect A2A `status-update` events whose message text matches the tool call pattern (e.g., text starting with `[Tool: <name>]` followed by JSON) and render them using the AI Elements `Tool` component with `ToolHeader`, `ToolInput`, and `ToolOutput` sub-components.

#### Scenario: Status-update with tool call pattern
- **WHEN** an agent response of kind `status-update` contains a text part matching `[Tool: <tool_name>]` followed by a JSON block
- **THEN** the response is rendered as a `Tool` component with the tool name in `ToolHeader`, the JSON parameters in `ToolInput`, and appropriate state badge

#### Scenario: Tool call with subsequent output
- **WHEN** a `status-update` with a tool call is followed by another `status-update` containing the tool's output text
- **THEN** the `Tool` component updates to show `state="output-available"` and renders the output text in `ToolOutput`

#### Scenario: Tool call state progression
- **WHEN** a `status-update` arrives with `state: "working"` containing a tool call
- **THEN** the `ToolHeader` displays a "Running" state badge with appropriate icon

### Requirement: Status-update progress messages render as Reasoning
The system SHALL render A2A `status-update` events that do not match the tool call pattern as `Reasoning` components, showing the agent's intermediate thinking/progress steps in a collapsible block.

#### Scenario: Non-tool status-update while working
- **WHEN** an agent response of kind `status-update` with `state: "working"` contains plain text (not a tool call pattern)
- **THEN** the text is rendered inside a `Reasoning` component that is open by default during streaming

#### Scenario: Reasoning closes when final response arrives
- **WHEN** the final agent response arrives (with `final: true`)
- **THEN** any open `Reasoning` components for that message close automatically

### Requirement: Task state transitions render as Task components
The system SHALL render A2A `task` events using the AI Elements `Task` component, displaying the task ID, current state, and any artifacts as collapsible `TaskItem` entries with status icons.

#### Scenario: Task with working state
- **WHEN** an agent response of kind `task` arrives with `status.state: "working"`
- **THEN** a `Task` component is rendered with an in-progress icon and the task ID

#### Scenario: Task with completed state
- **WHEN** an agent response of kind `task` arrives with `status.state: "completed"`
- **THEN** the `Task` component displays a completed icon and shows any artifacts as `TaskItem` entries

#### Scenario: Task with failed state
- **WHEN** an agent response of kind `task` arrives with `status.state: "failed"`
- **THEN** the `Task` component displays an error icon with the failure message

### Requirement: Artifact-updates render as Artifact components
The system SHALL render A2A `artifact-update` events using the AI Elements `Artifact` component, displaying each artifact part (text, file, or data) within a structured container with a header and content area.

#### Scenario: Artifact with text part
- **WHEN** an `artifact-update` contains a text part
- **THEN** the text is rendered as Markdown inside an `Artifact` component with `ArtifactContent`

#### Scenario: Artifact with file part
- **WHEN** an `artifact-update` contains a file part with image MIME type
- **THEN** the image is rendered inline inside the `ArtifactContent` with appropriate media rendering

#### Scenario: Artifact with data part (JSON)
- **WHEN** an `artifact-update` contains a data part with structured JSON
- **THEN** the JSON is rendered using a `CodeBlock` component inside the `ArtifactContent`

### Requirement: Kind chips remain visible on specialized renders
The system SHALL display a small badge/chip indicating the A2A event kind (e.g., "status-update", "task", "artifact-update", "message") alongside each specialized component render, preserving protocol-level visibility.

#### Scenario: Tool component shows kind chip
- **WHEN** a `status-update` is rendered as a `Tool` component
- **THEN** a small "status-update" badge is visible near the component header

#### Scenario: Task component shows kind chip
- **WHEN** a `task` event is rendered as a `Task` component
- **THEN** a small "task" badge is visible near the component header

### Requirement: Error responses render distinctly
The system SHALL render A2A error responses with a visually distinct error style, showing the error message prominently with an error icon and red-tinted styling.

#### Scenario: Agent returns an error
- **WHEN** an agent response contains an `error` field
- **THEN** the error is rendered as a `Message` with `from="assistant"` and error styling (red border/background), displaying the error message text

### Requirement: Multimedia content renders inline
The system SHALL render file parts containing images, audio, and video inline within message or artifact components. Images SHALL display as thumbnails, audio as playable controls, and video as embedded players.

#### Scenario: Image file in agent response
- **WHEN** an agent response contains a file part with `mimeType` starting with `image/`
- **THEN** the image is displayed inline with max dimensions of 400x300px

#### Scenario: Audio file in agent response
- **WHEN** an agent response contains a file part with `mimeType` starting with `audio/`
- **THEN** an audio player control is rendered inline

#### Scenario: Video file in agent response
- **WHEN** an agent response contains a file part with `mimeType` starting with `video/`
- **THEN** a video player is rendered inline with max dimensions of 400x300px

### Requirement: Fallback rendering for unrecognized response types
The system SHALL gracefully handle unrecognized A2A response kinds by rendering them as generic `Message` components with the raw content displayed.

#### Scenario: Unknown response kind
- **WHEN** an agent response has a `kind` value not in the recognized set
- **THEN** the response is rendered as a generic `Message` with `from="assistant"` showing the raw text content
