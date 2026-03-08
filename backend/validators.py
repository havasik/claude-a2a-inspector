from typing import Any


def validate_agent_card(card_data: dict[str, Any]) -> list[str]:
    """Validate the structure and fields of an agent card."""
    errors: list[str] = []

    # Use a frozenset for efficient checking and to indicate immutability.
    required_fields = frozenset(
        [
            'name',
            'description',
            'url',
            'version',
            'capabilities',
            'defaultInputModes',
            'defaultOutputModes',
            'skills',
        ]
    )

    # Check for the presence of all required fields
    for field in required_fields:
        if field not in card_data:
            errors.append(f"Required field is missing: '{field}'.")

    # Check if 'url' is an absolute URL (basic check)
    if 'url' in card_data and not (
        card_data['url'].startswith('http://')
        or card_data['url'].startswith('https://')
    ):
        errors.append(
            "Field 'url' must be an absolute URL starting with http:// or https://."
        )

    # Check if capabilities is a dictionary
    if 'capabilities' in card_data and not isinstance(
        card_data['capabilities'], dict
    ):
        errors.append("Field 'capabilities' must be an object.")

    # Check if defaultInputModes and defaultOutputModes are arrays of strings
    for field in ['defaultInputModes', 'defaultOutputModes']:
        if field in card_data:
            if not isinstance(card_data[field], list):
                errors.append(f"Field '{field}' must be an array of strings.")
            elif not all(isinstance(item, str) for item in card_data[field]):
                errors.append(f"All items in '{field}' must be strings.")

    # Check skills array
    if 'skills' in card_data:
        if not isinstance(card_data['skills'], list):
            errors.append(
                "Field 'skills' must be an array of AgentSkill objects."
            )
        elif not card_data['skills']:
            errors.append(
                "Field 'skills' array is empty. Agent must have at least one skill if it performs actions."
            )

    return errors


def _validate_task(data: dict[str, Any]) -> list[str]:
    errors = []
    if 'id' not in data:
        errors.append("Task object missing required field: 'id'.")
    if 'status' not in data or 'state' not in data.get('status', {}):
        errors.append("Task object missing required field: 'status.state'.")
    return errors


def _validate_status_update(data: dict[str, Any]) -> list[str]:
    errors = []
    if 'status' not in data or 'state' not in data.get('status', {}):
        errors.append(
            "StatusUpdate object missing required field: 'status.state'."
        )
    return errors


def _validate_artifact_update(data: dict[str, Any]) -> list[str]:
    errors = []
    if 'artifact' not in data:
        errors.append(
            "ArtifactUpdate object missing required field: 'artifact'."
        )
    elif (
        'parts' not in data.get('artifact', {})
        or not isinstance(data.get('artifact', {}).get('parts'), list)
        or not data.get('artifact', {}).get('parts')
    ):
        errors.append("Artifact object must have a non-empty 'parts' array.")
    return errors


def _validate_message(data: dict[str, Any]) -> list[str]:
    errors = []
    if (
        'parts' not in data
        or not isinstance(data.get('parts'), list)
        or not data.get('parts')
    ):
        errors.append("Message object must have a non-empty 'parts' array.")
    if 'role' not in data or data.get('role') != 'agent':
        errors.append("Message from agent must have 'role' set to 'agent'.")
    return errors


ARK_VALID_KINDS = frozenset([
    'tool-call', 'input-request', 'input-response',
    'thought', 'text', 'text-stream',
])


def validate_ark_envelope(data: dict[str, Any]) -> list[str]:
    """Validate an ARK envelope structure."""
    errors: list[str] = []
    if not isinstance(data, dict):
        return ['ARK: envelope must be an object.']

    ark = data.get('ark')
    if not isinstance(ark, dict):
        return ['ARK: missing or invalid "ark" field.']

    for field in ('version', 'kind', 'id', 'timestamp'):
        if field not in ark or not isinstance(ark[field], str):
            errors.append(f"ARK: missing or invalid field 'ark.{field}'.")

    if 'payload' not in ark or not isinstance(ark.get('payload'), dict):
        errors.append("ARK: missing or invalid field 'ark.payload'.")

    kind = ark.get('kind')
    if isinstance(kind, str) and kind not in ARK_VALID_KINDS:
        errors.append(f"ARK: unknown kind '{kind}'.")

    return errors


def _find_ark_envelopes_in_parts(parts: list) -> list[dict[str, Any]]:
    """Extract potential ARK envelopes from a list of parts."""
    envelopes: list[dict[str, Any]] = []
    for part in parts:
        if not isinstance(part, dict):
            continue
        # DataPart with kind "data"
        if part.get('kind') == 'data' and isinstance(part.get('data'), dict):
            data_obj = part['data']
            if 'ark' in data_obj:
                envelopes.append(data_obj)
        # Direct ARK envelope in part
        if 'ark' in part and isinstance(part.get('ark'), dict):
            envelopes.append(part)
    return envelopes


def validate_ark_in_response(data: dict[str, Any]) -> list[str]:
    """Scan response data for ARK envelopes and validate them."""
    errors: list[str] = []

    # Check parts
    parts = data.get('parts', [])
    if isinstance(parts, list):
        for envelope in _find_ark_envelopes_in_parts(parts):
            errors.extend(validate_ark_envelope(envelope))

    # Check artifacts
    artifacts = data.get('artifacts', [])
    if isinstance(artifacts, list):
        for artifact in artifacts:
            if isinstance(artifact, dict):
                artifact_parts = artifact.get('parts', [])
                if isinstance(artifact_parts, list):
                    for envelope in _find_ark_envelopes_in_parts(artifact_parts):
                        errors.extend(validate_ark_envelope(envelope))

    # Check status message parts
    status = data.get('status')
    if isinstance(status, dict):
        msg = status.get('message')
        if isinstance(msg, dict):
            msg_parts = msg.get('parts', [])
            if isinstance(msg_parts, list):
                for envelope in _find_ark_envelopes_in_parts(msg_parts):
                    errors.extend(validate_ark_envelope(envelope))

    return errors


def validate_message(data: dict[str, Any]) -> list[str]:
    """Validate an incoming message from the agent based on its kind."""
    if 'kind' not in data:
        return ["Response from agent is missing required 'kind' field."]

    kind = data.get('kind')
    validators = {
        'task': _validate_task,
        'status-update': _validate_status_update,
        'artifact-update': _validate_artifact_update,
        'message': _validate_message,
    }

    validator = validators.get(str(kind))
    if validator:
        return validator(data)

    return [f"Unknown message kind received: '{kind}'."]
