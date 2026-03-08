## ADDED Requirements

### Requirement: Confirmation input requests are clickable
When an ARK `input-request` event with type `confirmation` is received, the UI SHALL render enabled confirm and deny buttons that the user can click to respond.

#### Scenario: User confirms an input request
- **WHEN** the user clicks the confirm button on a confirmation input request
- **THEN** the system sends a `send_message` event to the backend containing an ARK `input-response` envelope with `type: "confirmation"`, `value: true`, and the original request's ID as `requestId`

#### Scenario: User denies an input request
- **WHEN** the user clicks the deny button on a confirmation input request
- **THEN** the system sends a `send_message` event with an ARK `input-response` envelope with `type: "confirmation"`, `value: false`, and the original `requestId`

#### Scenario: Buttons disable after response
- **WHEN** the user clicks either confirm or deny
- **THEN** the buttons become disabled and the selected choice is visually indicated

### Requirement: Select input requests allow single selection
When an ARK `input-request` event with type `select` is received, the UI SHALL render enabled radio buttons that the user can select from, with a submit action.

#### Scenario: User selects an option
- **WHEN** the user selects a radio option and submits
- **THEN** the system sends a `send_message` event with an ARK `input-response` envelope with `type: "select"`, `value: "<selected-option-id>"`, and the original `requestId`

#### Scenario: Selection disables after response
- **WHEN** the user submits a selection
- **THEN** the radio buttons become disabled and the selected option is visually indicated

### Requirement: Multi-select input requests allow multiple selections
When an ARK `input-request` event with type `multi-select` is received, the UI SHALL render enabled checkboxes that the user can select, with a submit action.

#### Scenario: User selects multiple options
- **WHEN** the user checks multiple options and submits
- **THEN** the system sends a `send_message` event with an ARK `input-response` envelope with `type: "multi-select"`, `value: ["<id1>", "<id2>"]`, and the original `requestId`

#### Scenario: Multi-select disables after response
- **WHEN** the user submits their selections
- **THEN** the checkboxes become disabled and selected options are visually indicated

### Requirement: Free-text input requests accept text input
When an ARK `input-request` event with type `free-text` is received, the UI SHALL render an enabled text input with a submit action.

#### Scenario: User submits free text
- **WHEN** the user types text and submits
- **THEN** the system sends a `send_message` event with an ARK `input-response` envelope with `type: "free-text"`, `value: "<entered-text>"`, and the original `requestId`

#### Scenario: Free-text disables after response
- **WHEN** the user submits text
- **THEN** the text input becomes disabled showing the submitted text

### Requirement: Input responses use existing send_message path
All input responses SHALL be sent as standard `send_message` socket events with the ARK `input-response` envelope embedded as a DataPart in the message. The backend SHALL process `parts` from the frontend payload and forward DataParts to the agent via the A2A client.

#### Scenario: Input response flows through existing pipeline
- **WHEN** any input response is sent
- **THEN** it is emitted as `emit('send_message', { message: "", id: msgId, contextId: state.contextId, parts: [{ type: "data", data: { ark: { kind: "input-response", ... } } }] })`

#### Scenario: Backend forwards DataParts to agent
- **WHEN** the backend receives a `send_message` event with `parts` containing a DataPart
- **THEN** the backend wraps each DataPart in an A2A SDK `DataPart` object and includes it in the message sent to the agent

#### Scenario: Agent receives input-response envelope
- **WHEN** the user responds to a multi-select input request selecting "config" and "data"
- **THEN** the agent receives a message with a DataPart containing `{ ark: { kind: "input-response", payload: { type: "multi-select", value: ["config", "data"], requestId: "..." } } }`

### Requirement: Input response appears in chat as user message
When the user responds to an input request, a user-role message SHALL appear in the chat indicating what was selected.

#### Scenario: Confirmation response shown in chat
- **WHEN** the user clicks confirm on a confirmation request
- **THEN** a user message bubble appears in the chat showing the confirmation action
