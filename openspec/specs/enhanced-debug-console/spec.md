## ADDED Requirements

### Requirement: Debug log entries use CodeBlock for JSON rendering
The system SHALL render the JSON content of each debug log entry using the AI Elements `CodeBlock` component with `language="json"`, providing syntax highlighting and a copy-to-clipboard button.

#### Scenario: Request log entry is displayed
- **WHEN** a debug log entry of type `request` is received
- **THEN** the JSON data is rendered in a `CodeBlock` with JSON syntax highlighting, a "Request" label, and blue-tinted styling

#### Scenario: Response log entry is displayed
- **WHEN** a debug log entry of type `response` is received
- **THEN** the JSON data is rendered in a `CodeBlock` with JSON syntax highlighting, a "Response" label, and gray-tinted styling

#### Scenario: User copies log entry JSON
- **WHEN** the user clicks the copy button on a debug log `CodeBlock`
- **THEN** the full JSON content is copied to the clipboard

### Requirement: Debug console retains slide-up panel behavior
The system SHALL render the debug console as a fixed-position panel at the bottom of the viewport with a draggable handle for resizing. The panel SHALL toggle between visible and hidden states via a show/hide button.

#### Scenario: User toggles debug console visibility
- **WHEN** the user clicks the show/hide toggle button
- **THEN** the debug console slides up (if hidden) or slides down (if visible) with smooth animation

#### Scenario: User resizes the debug console
- **WHEN** the user drags the debug console handle
- **THEN** the console height adjusts between 40px and 90% of the viewport height

### Requirement: Debug console supports clearing
The system SHALL provide a clear button that removes all log entries from the debug console and resets the internal log store.

#### Scenario: User clears the debug console
- **WHEN** the user clicks the "Clear" button
- **THEN** all log entries are removed from the display and the raw log store is emptied

### Requirement: Debug log pruning at 500 entries
The system SHALL automatically prune debug log entries when the count exceeds 500, removing the oldest entries first.

#### Scenario: Log count exceeds 500
- **WHEN** the 501st log entry is added
- **THEN** the oldest log entry is removed from both the display and the internal store

### Requirement: Error and validation error log entries have distinct styling
The system SHALL render error-type and validation-error-type debug log entries with distinct visual styling — red-tinted for errors and yellow-tinted for validation errors.

#### Scenario: Error log entry
- **WHEN** a debug log entry of type `error` is received
- **THEN** the entry is rendered with red-tinted background and left border

#### Scenario: Validation error log entry
- **WHEN** a debug log entry of type `validation_error` is received
- **THEN** the entry is rendered with yellow-tinted background and left border
