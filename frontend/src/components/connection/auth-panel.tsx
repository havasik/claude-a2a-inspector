import React, {useCallback, useEffect, useState} from 'react';

type AuthType = 'none' | 'basic' | 'bearer' | 'api-key';

interface AuthPanelProps {
  onHeadersChange: (headers: Record<string, string>) => void;
  disabled: boolean;
}

export function AuthPanel({onHeadersChange, disabled}: AuthPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [authType, setAuthType] = useState<AuthType>('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [customHeaders, setCustomHeaders] = useState<
    {key: string; value: string}[]
  >([]);

  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {};

    switch (authType) {
      case 'basic':
        if (username) {
          headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
        }
        break;
      case 'bearer':
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        break;
      case 'api-key':
        if (apiKeyName && apiKeyValue) {
          headers[apiKeyName] = apiKeyValue;
        }
        break;
    }

    for (const h of customHeaders) {
      if (h.key && h.value) {
        headers[h.key] = h.value;
      }
    }

    return headers;
  }, [
    authType,
    username,
    password,
    token,
    apiKeyName,
    apiKeyValue,
    customHeaders,
  ]);

  useEffect(() => {
    onHeadersChange(buildHeaders());
  }, [buildHeaders, onHeadersChange]);

  const addHeader = () =>
    setCustomHeaders(prev => [...prev, {key: '', value: ''}]);
  const removeHeader = (index: number) =>
    setCustomHeaders(prev => prev.filter((_, i) => i !== index));
  const updateHeader = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) =>
    setCustomHeaders(prev =>
      prev.map((h, i) => (i === index ? {...h, [field]: value} : h))
    );

  const inputClass =
    'w-full px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-input-bg)] text-[var(--color-text-primary)] text-sm disabled:opacity-50';

  return (
    <div className="border-t border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
      >
        <span className="mr-1">{isOpen ? '▼' : '►'}</span>
        Authentication & Headers
      </button>

      {isOpen && (
        <div className="px-4 pb-3 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-text-secondary)]">
              Auth Type
            </label>
            <select
              value={authType}
              onChange={e => setAuthType(e.target.value as AuthType)}
              disabled={disabled}
              className={inputClass + ' !w-auto'}
            >
              <option value="none">No Auth</option>
              <option value="basic">Basic Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="api-key">API Key</option>
            </select>
          </div>

          {authType === 'basic' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={disabled}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={disabled}
                className={inputClass}
              />
            </div>
          )}

          {authType === 'bearer' && (
            <input
              type="password"
              placeholder="Bearer Token"
              value={token}
              onChange={e => setToken(e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          )}

          {authType === 'api-key' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Header Name"
                value={apiKeyName}
                onChange={e => setApiKeyName(e.target.value)}
                disabled={disabled}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="API Key Value"
                value={apiKeyValue}
                onChange={e => setApiKeyValue(e.target.value)}
                disabled={disabled}
                className={inputClass}
              />
            </div>
          )}

          <div className="border-t border-[var(--color-border)] pt-2">
            <div className="text-sm text-[var(--color-text-secondary)] mb-2">
              Custom Headers
            </div>
            {customHeaders.map((h, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  placeholder="Header Name"
                  value={h.key}
                  onChange={e => updateHeader(i, 'key', e.target.value)}
                  disabled={disabled}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={h.value}
                  onChange={e => updateHeader(i, 'value', e.target.value)}
                  disabled={disabled}
                  className={inputClass}
                />
                <button
                  onClick={() => removeHeader(i)}
                  disabled={disabled}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addHeader}
              disabled={disabled}
              className="text-sm text-[var(--color-button-bg)] hover:underline disabled:opacity-50"
            >
              + Add Header
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
