import hashlib
import logging

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse, urlunparse
from uuid import uuid4

import bleach
import httpx
import socketio
import validators

from a2a.client import A2ACardResolver
from a2a.client.client import Client, ClientConfig, ClientEvent
from a2a.client.client_factory import ClientFactory
from a2a.types import (
    AgentCard,
    DataPart,
    FilePart,
    FileWithBytes,
    Message,
    Role,
    Task,
    TaskArtifactUpdateEvent,
    TaskStatusUpdateEvent,
    TextPart,
    TransportProtocol,
)
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


STANDARD_HEADERS = {
    'host',
    'user-agent',
    'accept',
    'content-type',
    'content-length',
    'connection',
    'accept-encoding',
}

# ==============================================================================
# Setup
# ==============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

app = FastAPI()
# NOTE: In a production environment, cors_allowed_origins should be restricted
# to the specific frontend domain, not a wildcard '*'.
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)
app.mount('/socket.io', socket_app)

app.mount('/static', StaticFiles(directory='../frontend/public'), name='static')
templates = Jinja2Templates(directory='../frontend/public')

# ==============================================================================
# State Management
# ==============================================================================

# NOTE: This global dictionary stores state. For a simple inspector tool with
# transient connections, this is acceptable. For a scalable production service,
# a more robust state management solution (e.g., Redis) would be required.
ARK_EXTENSION_URI_PREFIX = 'https://ark.a2a-extensions.org/'

# Tuple: (httpx_client, a2a_client, card, transport_protocol, ark_extension_uri)
clients: dict[str, tuple[httpx.AsyncClient, Client, AgentCard, str, str | None]] = {}
# Track emitted event fingerprints per session to deduplicate SSE fan-out
_emitted_events: dict[str, set[str]] = {}


# ==============================================================================
# Socket.IO Event Helpers
# ==============================================================================


async def _emit_debug_log(
    sid: str, event_id: str, log_type: str, data: Any
) -> None:
    """Helper to emit a structured debug log event to the client."""
    await sio.emit(
        'debug_log', {'type': log_type, 'data': data, 'id': event_id}, to=sid
    )


async def _process_a2a_response(
    client_event: ClientEvent | Message,
    sid: str,
    request_id: str,
) -> None:
    """Processes a response from the A2A client, validates it, and emits events.

    This function handles the incoming ClientEvent or Message object,
    correlating it with the original request using the session ID and request ID.

    Args:
    client_event: The event or message received.
    sid: The session ID associated with the original request.
    request_id: The unique ID of the original request.
    """
    # The response payload 'event' (Task, Message, etc.) may have its own 'id',
    # which can differ from the JSON-RPC request/response 'id'. We prioritize
    # the payload's ID for client-side correlation if it exists.

    event: TaskStatusUpdateEvent | TaskArtifactUpdateEvent | Task | Message
    if isinstance(client_event, tuple):
        event = client_event[1] if client_event[1] else client_event[0]
    else:
        event = client_event

    response_id = getattr(event, 'id', request_id)

    response_data = event.model_dump(exclude_none=True)

    # Deduplicate SSE fan-out: when multiple send_message calls subscribe
    # to the same task, each event arrives on every stream. Fingerprint
    # by the event content (before we overwrite 'id') to skip duplicates.
    fingerprint = hashlib.md5(
        str(response_data).encode(), usedforsecurity=False
    ).hexdigest()
    seen = _emitted_events.setdefault(sid, set())
    if fingerprint in seen:
        return
    seen.add(fingerprint)

    response_data['id'] = response_id

    validation_errors = validators.validate_message(response_data)
    ark_errors = validators.validate_ark_in_response(response_data)
    validation_errors.extend(ark_errors)
    response_data['validation_errors'] = validation_errors

    await _emit_debug_log(sid, response_id, 'response', response_data)
    await sio.emit('agent_response', response_data, to=sid)


def get_card_resolver(
    client: httpx.AsyncClient, agent_card_url: str
) -> A2ACardResolver:
    """Returns an A2ACardResolver for the given agent card URL."""
    parsed_url = urlparse(agent_card_url)
    base_url = f'{parsed_url.scheme}://{parsed_url.netloc}'
    path_with_query = urlunparse(
        ('', '', parsed_url.path, '', parsed_url.query, '')
    )
    card_path = path_with_query.lstrip('/')
    if card_path:
        card_resolver = A2ACardResolver(
            client, base_url, agent_card_path=card_path
        )
    else:
        card_resolver = A2ACardResolver(client, base_url)

    return card_resolver


# ==============================================================================
# FastAPI Routes
# ==============================================================================


@app.get('/', response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    """Serve the main index.html page."""
    return templates.TemplateResponse('index.html', {'request': request})


@app.post('/agent-card')
async def get_agent_card(request: Request) -> JSONResponse:
    """Fetch and validate the agent card from a given URL."""
    # 1. Parse request and get sid. If this fails, we can't do much.
    try:
        request_data = await request.json()
        agent_url = request_data.get('url')
        sid = request_data.get('sid')

        if not agent_url or not sid:
            return JSONResponse(
                content={'error': 'Agent URL and SID are required.'},
                status_code=400,
            )
    except Exception:
        logger.warning('Failed to parse JSON from /agent-card request.')
        return JSONResponse(
            content={'error': 'Invalid request body.'}, status_code=400
        )

    # Extract custom headers from the request
    custom_headers = {
        name: value
        for name, value in request.headers.items()
        if name.lower() not in STANDARD_HEADERS
    }

    # 2. Log the request.
    await _emit_debug_log(
        sid,
        'http-agent-card',
        'request',
        {
            'endpoint': '/agent-card',
            'payload': request_data,
            'custom_headers': custom_headers,
        },
    )

    # 3. Perform the main action and prepare response.
    try:
        async with httpx.AsyncClient(
            timeout=30.0, headers=custom_headers
        ) as client:
            card_resolver = get_card_resolver(client, agent_url)
            card = await card_resolver.get_agent_card()

        card_data = card.model_dump(exclude_none=True)
        validation_errors = validators.validate_agent_card(card_data)
        response_data = {
            'card': card_data,
            'validation_errors': validation_errors,
        }
        response_status = 200

    except httpx.RequestError as e:
        logger.error(
            f'Failed to connect to agent at {agent_url}', exc_info=True
        )
        response_data = {'error': f'Failed to connect to agent: {e}'}
        response_status = 502  # Bad Gateway
    except Exception as e:
        logger.error('An internal server error occurred', exc_info=True)
        response_data = {'error': f'An internal server error occurred: {e}'}
        response_status = 500

    # 4. Log the response and return it.
    await _emit_debug_log(
        sid,
        'http-agent-card',
        'response',
        {'status': response_status, 'payload': response_data},
    )
    return JSONResponse(content=response_data, status_code=response_status)


# ==============================================================================
# Socket.IO Event Handlers
# ==============================================================================


@sio.on('connect')
async def handle_connect(sid: str, environ: dict[str, Any]) -> None:
    """Handle the 'connect' socket.io event."""
    logger.info(f'Client connected: {sid}, environment: {environ}')


@sio.on('disconnect')
async def handle_disconnect(sid: str) -> None:
    """Handle the 'disconnect' socket.io event."""
    logger.info(f'Client disconnected: {sid}')
    if sid in clients:
        httpx_client, _, _, _, _ = clients.pop(sid)
        await httpx_client.aclose()
        logger.info(f'Cleaned up client for {sid}')
    _emitted_events.pop(sid, None)


@sio.on('initialize_client')
async def handle_initialize_client(sid: str, data: dict[str, Any]) -> None:
    """Handle the 'initialize_client' socket.io event."""
    agent_card_url = data.get('url')

    custom_headers = data.get('customHeaders', {})

    if not agent_card_url:
        await sio.emit(
            'client_initialized',
            {'status': 'error', 'message': 'Agent URL is required.'},
            to=sid,
        )
        return

    httpx_client = None
    try:
        httpx_client = httpx.AsyncClient(timeout=600.0, headers=custom_headers)
        card_resolver = get_card_resolver(httpx_client, agent_card_url)
        card = await card_resolver.get_agent_card()

        a2a_config = ClientConfig(
            supported_transports=[
                TransportProtocol.jsonrpc,
                TransportProtocol.http_json,
                TransportProtocol.jsonrpc,
                TransportProtocol.grpc,
            ],
            use_client_preference=True,
            httpx_client=httpx_client,
        )
        factory = ClientFactory(a2a_config)
        a2a_client = factory.create(card)
        transport_protocol = (
            card.preferred_transport or TransportProtocol.jsonrpc
        )

        # Detect ARK extension support in agent card
        ark_extension_uri: str | None = None
        capabilities = getattr(card, 'capabilities', None)
        if capabilities:
            extensions = getattr(capabilities, 'extensions', None) or []
            for ext in extensions:
                uri = getattr(ext, 'uri', '') or ''
                if uri.startswith(ARK_EXTENSION_URI_PREFIX):
                    ark_extension_uri = uri
                    logger.info(f'ARK extension detected for {sid}: {uri}')
                    break

        clients[sid] = (
            httpx_client, a2a_client, card, transport_protocol, ark_extension_uri
        )

        input_modes = getattr(card, 'default_input_modes', ['text/plain'])
        output_modes = getattr(card, 'default_output_modes', ['text/plain'])

        await sio.emit(
            'client_initialized',
            {
                'status': 'success',
                'transport': str(transport_protocol),
                'inputModes': input_modes,
                'outputModes': output_modes,
                'arkSupported': ark_extension_uri is not None,
            },
            to=sid,
        )
    except Exception as e:
        logger.error(
            f'Failed to initialize client for {sid}: {e}', exc_info=True
        )
        # Clean up httpx_client
        if httpx_client is not None:
            await httpx_client.aclose()
        await sio.emit(
            'client_initialized', {'status': 'error', 'message': str(e)}, to=sid
        )


@sio.on('send_message')
async def handle_send_message(sid: str, json_data: dict[str, Any]) -> None:
    """Handle the 'send_message' socket.io event."""
    message_text = bleach.clean(json_data.get('message', ''))

    message_id = json_data.get('id', str(uuid4()))
    context_id = json_data.get('contextId')
    task_id = json_data.get('taskId')
    metadata = json_data.get('metadata', {})

    if sid not in clients:
        await sio.emit(
            'agent_response',
            {'error': 'Client not initialized.', 'id': message_id},
            to=sid,
        )
        return

    _, a2a_client, _, transport, ark_uri = clients[sid]

    attachments = json_data.get('attachments', [])

    parts: list = []
    if ark_uri and message_text:
        ark_envelope = {
            'ark': {
                'version': '0.1.0',
                'kind': 'text',
                'id': message_id,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'payload': {'content': str(message_text)},
            }
        }
        parts.append(DataPart(data=ark_envelope))  # type: ignore[arg-type]
    elif message_text:
        parts.append(TextPart(text=str(message_text)))  # type: ignore[arg-type]

    for attachment in attachments:
        parts.append(
            FilePart(  # type: ignore[arg-type]
                file=FileWithBytes(
                    bytes=attachment['data'], mime_type=attachment['mimeType']
                )
            )
        )

    # Forward DataParts from frontend (e.g., ARK input-response envelopes)
    frontend_parts = json_data.get('parts', [])
    for fp in frontend_parts:
        if isinstance(fp, dict) and fp.get('type') == 'data' and 'data' in fp:
            parts.append(DataPart(data=fp['data']))  # type: ignore[arg-type]

    message = Message(
        role=Role.user,
        parts=parts,
        message_id=message_id,
        context_id=context_id,
        task_id=task_id,
        metadata=metadata,
        extensions=[ark_uri] if ark_uri else None,
    )

    debug_request = {
        'transport': transport,
        'method': 'message/send',
        'message': message.model_dump(exclude_none=True),
    }
    await _emit_debug_log(sid, message_id, 'request', debug_request)

    try:
        response_stream = a2a_client.send_message(message)
        async for stream_result in response_stream:
            await _process_a2a_response(stream_result, sid, message_id)

    except Exception as e:
        logger.error(f'Failed to send message for sid {sid}', exc_info=True)
        await sio.emit(
            'agent_response',
            {'error': f'Failed to send message: {e}', 'id': message_id},
            to=sid,
        )


# ==============================================================================
# Main Execution
# ==============================================================================


if __name__ == '__main__':
    import uvicorn

    # NOTE: The 'reload=True' flag is for development purposes only.
    # In a production environment, use a proper process manager like Gunicorn.
    uvicorn.run('app:app', host='127.0.0.1', port=5001, reload=True)
