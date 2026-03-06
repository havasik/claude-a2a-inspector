## 1. ARK Detection & State

- [x] 1.1 Extend `clients` dict type annotation from 4-tuple to 5-tuple, adding `str | None` for ARK extension URI
- [x] 1.2 In `handle_initialize_client`, after resolving the agent card, extract ARK extension URI from `card.capabilities.extensions` (match URI prefix `https://ark.a2a-extensions.org/`)
- [x] 1.3 Store the ARK extension URI (or None) as the 5th element of the clients tuple
- [x] 1.4 Update `handle_disconnect` to unpack the 5-tuple correctly

## 2. Frontend Signaling

- [x] 2.1 Add `arkSupported` boolean to the `client_initialized` Socket.IO event emission (True if ARK URI found, False otherwise)

## 3. Message Extensions

- [x] 3.1 In `handle_send_message`, unpack the ARK URI from the 5-tuple
- [x] 3.2 When ARK URI is not None, set `extensions=[ark_uri]` on the outgoing `Message` object

## 4. ARK Response Validation

- [x] 4.1 Add `validate_ark_envelope()` function to `backend/validators.py` that checks DataPart payloads for valid ARK envelopes (ark.version, ark.kind, ark.id, ark.timestamp, ark.payload)
- [x] 4.2 In `_process_a2a_response`, after existing A2A validation, scan response parts for ARK envelopes and validate them
- [x] 4.3 Append any ARK validation errors to the `validation_errors` array

## 5. Testing

- [x] 5.1 Add tests for ARK extension detection: card with ARK extension, card without, card with no extensions field
- [x] 5.2 Add tests for `validate_ark_envelope()`: valid envelope, missing fields, invalid kinds
- [x] 5.3 Add tests for ARK validation integration in response processing
