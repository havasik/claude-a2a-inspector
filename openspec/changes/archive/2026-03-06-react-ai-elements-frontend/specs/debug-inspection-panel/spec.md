## ADDED Requirements

### Requirement: Tabbed debug panel
The system SHALL display a debug panel alongside the chat view with tabs for Traffic Log, Validation, and Raw JSON. The panel SHALL be resizable relative to the chat panel.

#### Scenario: Debug panel displays tabs
- **WHEN** the application is connected to an agent
- **THEN** the debug panel shows three tabs: Traffic Log, Validation, Raw JSON

#### Scenario: Panel is resizable
- **WHEN** the user drags the divider between chat and debug panels
- **THEN** the panels resize proportionally

### Requirement: Traffic log with JSON-RPC display
The Traffic Log tab SHALL display raw `debug_log` Socket.IO events in a scrollable terminal-style view. Each log entry SHALL be syntax-highlighted JSON. The log SHALL maintain a maximum of 500 entries, removing oldest entries when the limit is exceeded. The log SHALL auto-scroll to the latest entry.

#### Scenario: Debug log event received
- **WHEN** a `debug_log` Socket.IO event is received
- **THEN** the event is appended to the traffic log with syntax-highlighted JSON and type indicator (request/response/error/validation_error)

#### Scenario: Log limit exceeded
- **WHEN** the traffic log reaches 500 entries and a new entry arrives
- **THEN** the oldest entry is removed to maintain the 500-entry cap

#### Scenario: Auto-scroll behavior
- **WHEN** a new log entry is appended
- **THEN** the traffic log auto-scrolls to show the latest entry

### Requirement: Per-message validation display
The Validation tab SHALL show the A2A spec validation status for each agent response. Each entry SHALL display a compliance indicator (pass/fail) and list any validation errors returned in the `validation_errors` field of the `agent_response` event.

#### Scenario: Compliant response
- **WHEN** an agent response has an empty `validation_errors` array
- **THEN** the validation display shows a pass indicator for that message

#### Scenario: Non-compliant response
- **WHEN** an agent response has one or more entries in `validation_errors`
- **THEN** the validation display shows a fail indicator and lists each error

### Requirement: Raw JSON viewer for selected messages
The Raw JSON tab SHALL display the full JSON payload of a selected message with syntax highlighting and line numbers. Users SHALL be able to select any message from the chat to view its raw payload.

#### Scenario: Message selected for inspection
- **WHEN** the user clicks on a message in the chat panel
- **THEN** the Raw JSON tab displays the full JSON payload of that message with syntax highlighting

#### Scenario: No message selected
- **WHEN** no message has been clicked
- **THEN** the Raw JSON tab shows an empty state prompting the user to click a message

### Requirement: Validation indicators on chat messages
Each agent message in the chat panel SHALL display an inline validation indicator. Compliant messages show a pass icon. Non-compliant messages show a warning icon. Clicking the warning icon SHALL switch to the Validation tab with that message's errors highlighted.

#### Scenario: Compliant message indicator
- **WHEN** an agent message with no validation errors is displayed
- **THEN** a small pass icon appears on the message

#### Scenario: Non-compliant message indicator
- **WHEN** an agent message with validation errors is displayed
- **THEN** a small warning icon appears on the message

#### Scenario: Click validation indicator
- **WHEN** the user clicks a warning icon on a non-compliant message
- **THEN** the debug panel switches to the Validation tab showing that message's errors
