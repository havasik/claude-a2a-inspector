## Why

The A2A Inspector backend does not include ARK extension URIs in outgoing messages, so agents that support ARK never activate rich responses (tool calls, thoughts, streaming text, input requests). The frontend already has ARK rendering support but never sees ARK data because the backend doesn't negotiate it.

## What Changes

- Detect ARK extension support in the agent card's `capabilities.extensions` during client initialization
- Store the detected ARK extension URI alongside the existing client state
- Include `extensions` field with the ARK URI in outgoing `Message` objects when the agent supports ARK
- Emit `arkSupported` flag in the `client_initialized` Socket.IO event so the frontend knows ARK is active
- Validate ARK envelopes in agent responses using the `a2a-extension-ark` Python SDK (in addition to existing A2A validation)

## Capabilities

### New Capabilities

- `ark-negotiation`: Detect ARK extension in agent card, include ARK URI in outgoing messages, validate ARK responses, and signal ARK support to the frontend

### Modified Capabilities

_(none)_

## Impact

- **Code**: `backend/app.py` — modifications to `handle_initialize_client` and `handle_send_message`, plus response validation in `_process_a2a_response`
- **Dependencies**: Add `a2a-extension-ark` Python SDK to `pyproject.toml` (for ARK envelope validation)
- **State**: Extend the `clients` dict tuple to include ARK support flag and extension URI
- **Socket.IO events**: `client_initialized` event gains `arkSupported` field; no new events
- **Frontend**: No frontend changes required (already handles ARK rendering when present)
