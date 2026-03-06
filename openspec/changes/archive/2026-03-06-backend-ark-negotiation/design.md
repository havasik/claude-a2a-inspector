## Context

The A2A Inspector backend (`backend/app.py`) proxies messages between the browser frontend and remote A2A agents. It stores per-session state in a global `clients` dict as a 4-tuple: `(httpx_client, a2a_client, card, transport_protocol)`. The `Message` objects sent to agents currently have no `extensions` field, so agents never receive ARK negotiation signals.

The ARK spec (v0.1.0) requires clients to include `"extensions": ["https://ark.a2a-extensions.org/v0.1.0"]` in messages to activate ARK mode. The agent card declares support via `capabilities.extensions` containing the ARK URI.

## Goals / Non-Goals

**Goals:**
- Detect ARK support from the agent card during initialization
- Include the ARK extension URI in outgoing messages
- Validate ARK envelopes in responses (alongside existing A2A validation)
- Signal ARK support to the frontend

**Non-Goals:**
- Sending `input-response` messages back to the agent (requires a new Socket.IO event — separate change)
- Modifying any frontend code
- Supporting ARK extension versions other than v0.1.0

## Decisions

### 1. Extend the clients state tuple to 5 elements

**Decision:** Add `ark_extension_uri: str | None` as the 5th element of the clients tuple.

**Alternatives considered:**
- Separate dict for ARK state: Adds complexity for a single boolean+string.
- Dataclass for client state: Better design but larger refactor not needed for this change.

**Rationale:** Minimal change — one extra element. The tuple is already unpacked in only 2 places (`handle_disconnect`, `handle_send_message`).

### 2. Detect ARK via capabilities.extensions URI match

**Decision:** During `handle_initialize_client`, iterate `card.capabilities.extensions` looking for any extension with URI starting with `https://ark.a2a-extensions.org/`. Store the matched URI.

**Rationale:** Matching by URI prefix allows forward compatibility with future ARK versions while being specific enough to avoid false matches.

### 3. Include extensions in Message only when agent supports ARK

**Decision:** In `handle_send_message`, if `ark_extension_uri` is not None, set `message.extensions = [ark_extension_uri]`.

**Rationale:** Only negotiate ARK with agents that declared support. Non-ARK agents see no change.

### 4. Validate ARK envelopes in responses using the Python SDK

**Decision:** In `_process_a2a_response`, after existing A2A validation, check if response DataParts contain ARK envelopes and validate them via `a2a_extension_ark.validate()`. Append ARK validation errors alongside A2A validation errors.

**Alternatives considered:**
- Skip ARK validation: Simpler but defeats the inspector's purpose.
- Separate validation event: Would require frontend changes.

**Rationale:** Appending to the existing `validation_errors` array means the frontend already renders these — no frontend changes needed.

## Risks / Trade-offs

**[a2a-extension-ark package not on PyPI]** → The ARK Python SDK may not be published yet.
→ **Mitigation:** Install from git URL in pyproject.toml, or inline the validation logic if the package is unavailable.

**[Message.extensions field may not exist in a2a-sdk]** → The `a2a.types.Message` class may not have an `extensions` attribute yet.
→ **Mitigation:** Check the SDK's Message class. If missing, pass extensions via `metadata` as a fallback, or construct the message dict manually.
