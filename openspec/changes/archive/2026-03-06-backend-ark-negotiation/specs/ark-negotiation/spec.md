## ADDED Requirements

### Requirement: Detect ARK extension in agent card
The backend SHALL inspect `card.capabilities.extensions` during client initialization for any extension whose URI starts with `https://ark.a2a-extensions.org/`. The matched URI SHALL be stored in the session state.

#### Scenario: Agent card declares ARK support
- **WHEN** the agent card contains `capabilities.extensions` with an entry whose `uri` starts with `https://ark.a2a-extensions.org/`
- **THEN** the backend stores the ARK extension URI for that session

#### Scenario: Agent card does not declare ARK support
- **WHEN** the agent card has no matching ARK extension URI in `capabilities.extensions`
- **THEN** the backend stores `None` for the ARK extension URI and behaves identically to current behavior

#### Scenario: Agent card has no extensions field
- **WHEN** the agent card has no `capabilities.extensions` field at all
- **THEN** the backend stores `None` for the ARK extension URI

### Requirement: Signal ARK support to frontend
The backend SHALL include an `arkSupported` boolean field in the `client_initialized` Socket.IO event indicating whether the agent supports ARK.

#### Scenario: ARK-capable agent connected
- **WHEN** ARK extension was detected in the agent card
- **THEN** the `client_initialized` event includes `arkSupported: true`

#### Scenario: Non-ARK agent connected
- **WHEN** no ARK extension was detected
- **THEN** the `client_initialized` event includes `arkSupported: false`

### Requirement: Include ARK extension URI in outgoing messages
The backend SHALL include the ARK extension URI in the `extensions` field of outgoing `Message` objects when the connected agent supports ARK.

#### Scenario: Sending message to ARK-capable agent
- **WHEN** the session has a stored ARK extension URI and a message is sent
- **THEN** the outgoing `Message` includes `extensions` containing the ARK URI

#### Scenario: Sending message to non-ARK agent
- **WHEN** the session has no ARK extension URI and a message is sent
- **THEN** the outgoing `Message` has no `extensions` field (identical to current behavior)

### Requirement: Validate ARK envelopes in agent responses
The backend SHALL check agent response DataParts for ARK envelopes and validate them. ARK validation errors SHALL be appended to the existing `validation_errors` array in the response data emitted to the frontend.

#### Scenario: Response contains valid ARK envelope
- **WHEN** an agent response contains a DataPart with a valid ARK envelope
- **THEN** no additional validation errors are appended

#### Scenario: Response contains invalid ARK envelope
- **WHEN** an agent response contains a DataPart with an `ark` field that fails validation
- **THEN** the ARK validation errors are appended to `validation_errors`

#### Scenario: Response contains no ARK data
- **WHEN** an agent response has no DataParts with ARK envelopes
- **THEN** the existing A2A validation runs unchanged with no ARK-related errors
