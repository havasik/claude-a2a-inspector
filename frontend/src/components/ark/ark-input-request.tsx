import React, {useCallback, useState} from 'react';
import type {ArkEnvelope} from '../../lib/types';
import {useSocket} from '../../providers/socket-provider';
import {useAgentConnection} from '../../providers/agent-connection-provider';
import {generateMessageId} from '../../lib/utils';
import {useMessages} from '../../hooks/use-messages';
import {Button} from '../ui/button';

function formatResponseLabel(
  type: string,
  value: unknown,
  payload: Record<string, unknown>
): string {
  if (type === 'confirmation') {
    const actions = payload.actions as
      | {confirm?: {label: string}; deny?: {label: string}}
      | undefined;
    return value
      ? actions?.confirm?.label || 'Confirmed'
      : actions?.deny?.label || 'Denied';
  }
  if (type === 'select') {
    const options = (payload.options as {id: string; label: string}[]) || [];
    const opt = options.find(o => o.id === value);
    return opt?.label || String(value);
  }
  if (type === 'multi-select') {
    const options = (payload.options as {id: string; label: string}[]) || [];
    const ids = value as string[];
    return ids.map(id => options.find(o => o.id === id)?.label || id).join(', ');
  }
  return String(value);
}

interface ArkInputRequestProps {
  envelope: ArkEnvelope;
}

export function ArkInputRequest({envelope}: ArkInputRequestProps) {
  const payload = envelope.ark.payload;
  const requestId = envelope.ark.id;
  const type = payload.type as string;
  const message = payload.message as string;
  const title = payload.title as string | undefined;
  const [responded, setResponded] = useState(false);
  const [responseValue, setResponseValue] = useState<unknown>(null);

  const {emit} = useSocket();
  const {state: connState} = useAgentConnection();
  const {addUserMessage} = useMessages();

  const sendInputResponse = useCallback(
    (value: unknown) => {
      if (responded) return;

      // Show as user message in chat
      const label = formatResponseLabel(type, value, payload);
      addUserMessage(label);

      const msgId = generateMessageId();
      const arkEnvelope = {
        ark: {
          version: '0.1',
          kind: 'input-response',
          id: msgId,
          timestamp: new Date().toISOString(),
          payload: {
            type,
            value,
            requestId,
          },
        },
      };

      emit('send_message', {
        message: '',
        id: msgId,
        contextId: connState.contextId,
        metadata: {},
        attachments: [],
        parts: [{type: 'data', data: arkEnvelope}],
      });

      setResponded(true);
      setResponseValue(value);
    },
    [responded, type, requestId, emit, connState.contextId, addUserMessage, payload]
  );

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      {title && (
        <div className="text-sm font-medium text-foreground">{title}</div>
      )}

      <div className="text-sm text-muted-foreground">{message}</div>

      {type === 'confirmation' && (
        <ConfirmationInput
          payload={payload}
          responded={responded}
          responseValue={responseValue}
          onRespond={sendInputResponse}
        />
      )}
      {type === 'select' && (
        <SelectInput
          payload={payload}
          responded={responded}
          responseValue={responseValue}
          onRespond={sendInputResponse}
        />
      )}
      {type === 'multi-select' && (
        <MultiSelectInput
          payload={payload}
          responded={responded}
          responseValue={responseValue}
          onRespond={sendInputResponse}
        />
      )}
      {type === 'free-text' && (
        <FreeTextInput
          payload={payload}
          responded={responded}
          responseValue={responseValue}
          onRespond={sendInputResponse}
        />
      )}
    </div>
  );
}

interface InputProps {
  payload: Record<string, unknown>;
  responded: boolean;
  responseValue: unknown;
  onRespond: (value: unknown) => void;
}

function ConfirmationInput({
  payload,
  responded,
  responseValue,
  onRespond,
}: InputProps) {
  const actions = payload.actions as
    | {confirm?: {label: string}; deny?: {label: string}}
    | undefined;

  return (
    <div className="flex gap-2">
      <Button
        disabled={responded}
        onClick={() => onRespond(true)}
        variant={responded && responseValue === true ? 'default' : 'outline'}
        size="sm"
      >
        {actions?.confirm?.label || 'Confirm'}
      </Button>
      <Button
        disabled={responded}
        onClick={() => onRespond(false)}
        variant={responded && responseValue === false ? 'destructive' : 'outline'}
        size="sm"
      >
        {actions?.deny?.label || 'Deny'}
      </Button>
    </div>
  );
}

function SelectInput({payload, responded, responseValue, onRespond}: InputProps) {
  const options = (payload.options as {id: string; label: string}[]) || [];
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {options.map(opt => (
          <label
            key={opt.id}
            className={`flex items-center gap-2 text-sm cursor-pointer ${
              responded ? 'opacity-60 cursor-not-allowed' : ''
            } ${responded && responseValue === opt.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          >
            <input
              type="radio"
              name={`select-${payload.type}`}
              disabled={responded}
              checked={responded ? responseValue === opt.id : selected === opt.id}
              onChange={() => setSelected(opt.id)}
              className="accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {!responded && (
        <Button
          disabled={!selected}
          onClick={() => selected && onRespond(selected)}
          size="sm"
        >
          Submit
        </Button>
      )}
    </div>
  );
}

function MultiSelectInput({
  payload,
  responded,
  responseValue,
  onRespond,
}: InputProps) {
  const options = (payload.options as {id: string; label: string}[]) || [];
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const responseSet = new Set(
    Array.isArray(responseValue) ? (responseValue as string[]) : []
  );

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {options.map(opt => (
          <label
            key={opt.id}
            className={`flex items-center gap-2 text-sm cursor-pointer ${
              responded ? 'opacity-60 cursor-not-allowed' : ''
            } ${responded && responseSet.has(opt.id) ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          >
            <input
              type="checkbox"
              disabled={responded}
              checked={
                responded ? responseSet.has(opt.id) : selected.has(opt.id)
              }
              onChange={() => toggle(opt.id)}
              className="accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {!responded && (
        <Button
          disabled={selected.size === 0}
          onClick={() => onRespond([...selected])}
          size="sm"
        >
          Submit
        </Button>
      )}
    </div>
  );
}

function FreeTextInput({
  payload,
  responded,
  responseValue,
  onRespond,
}: InputProps) {
  const placeholder = (payload.placeholder as string) || 'Enter text...';
  const [text, setText] = useState('');

  return (
    <div className="flex gap-2">
      <input
        type="text"
        disabled={responded}
        value={responded ? String(responseValue || '') : text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && text.trim()) onRespond(text.trim());
        }}
        placeholder={placeholder}
        className="flex-1 px-2 py-1.5 rounded border border-input bg-background text-sm disabled:opacity-60"
      />
      {!responded && (
        <Button
          disabled={!text.trim()}
          onClick={() => onRespond(text.trim())}
          size="sm"
        >
          Submit
        </Button>
      )}
    </div>
  );
}
