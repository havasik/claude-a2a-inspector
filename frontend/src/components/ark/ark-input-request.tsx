import React from 'react';

interface ArkInputRequestProps {
  payload: Record<string, unknown>;
}

export function ArkInputRequest({payload}: ArkInputRequestProps) {
  const type = payload.type as string;
  const message = payload.message as string;
  const title = payload.title as string | undefined;

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">📝</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-kind-status)] text-[var(--color-text-secondary)]">
          {type}
        </span>
        <span className="text-xs text-[var(--color-text-muted)] italic">
          (display only)
        </span>
      </div>

      {title && (
        <div className="text-sm font-medium text-[var(--color-text-primary)]">
          {title}
        </div>
      )}

      <div className="text-sm text-[var(--color-text-secondary)]">
        {message}
      </div>

      {type === 'confirmation' && <ConfirmationDisplay payload={payload} />}
      {type === 'select' && <SelectDisplay payload={payload} />}
      {type === 'multi-select' && <MultiSelectDisplay payload={payload} />}
      {type === 'free-text' && <FreeTextDisplay payload={payload} />}
    </div>
  );
}

function ConfirmationDisplay({payload}: {payload: Record<string, unknown>}) {
  const actions = payload.actions as {
    confirm?: {label: string};
    deny?: {label: string};
  } | undefined;

  return (
    <div className="flex gap-2">
      <button
        disabled
        className="px-3 py-1.5 text-sm rounded bg-[var(--color-success)] text-white opacity-60 cursor-not-allowed"
      >
        {actions?.confirm?.label || 'Confirm'}
      </button>
      <button
        disabled
        className="px-3 py-1.5 text-sm rounded bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] opacity-60 cursor-not-allowed"
      >
        {actions?.deny?.label || 'Deny'}
      </button>
    </div>
  );
}

function SelectDisplay({payload}: {payload: Record<string, unknown>}) {
  const options = (payload.options as {id: string; label: string}[]) || [];

  return (
    <div className="space-y-1">
      {options.map(opt => (
        <label
          key={opt.id}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] opacity-60"
        >
          <input type="radio" disabled name="ark-select" />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function MultiSelectDisplay({payload}: {payload: Record<string, unknown>}) {
  const options = (payload.options as {id: string; label: string}[]) || [];

  return (
    <div className="space-y-1">
      {options.map(opt => (
        <label
          key={opt.id}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] opacity-60"
        >
          <input type="checkbox" disabled />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function FreeTextDisplay({payload}: {payload: Record<string, unknown>}) {
  const placeholder = (payload.placeholder as string) || 'Enter text...';

  return (
    <input
      type="text"
      disabled
      placeholder={placeholder}
      className="w-full px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-input-bg)] text-sm opacity-60 cursor-not-allowed"
    />
  );
}
