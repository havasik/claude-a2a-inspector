## MODIFIED Requirements

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
