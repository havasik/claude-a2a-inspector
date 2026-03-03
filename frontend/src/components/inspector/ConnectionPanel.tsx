import {useState, useCallback} from 'react';
import {ChevronDown, ChevronRight, Plus, X, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import type {AuthConfig, HeaderPair} from '@/hooks/useA2AConnection';

interface ConnectionPanelProps {
  isConnecting: boolean;
  connectionError: string | null;
  onConnect: (url: string, auth: AuthConfig, headers: HeaderPair[]) => void;
}

export function ConnectionPanel({
  isConnecting,
  connectionError,
  onConnect,
}: ConnectionPanelProps) {
  const [url, setUrl] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState<AuthConfig['type']>('none');
  const [bearerToken, setBearerToken] = useState('');
  const [basicUsername, setBasicUsername] = useState('');
  const [basicPassword, setBasicPassword] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [headers, setHeaders] = useState<HeaderPair[]>([]);

  const addHeader = useCallback(() => {
    setHeaders(prev => [
      ...prev,
      {id: crypto.randomUUID(), key: '', value: ''},
    ]);
  }, []);

  const removeHeader = useCallback((id: string) => {
    setHeaders(prev => prev.filter(h => h.id !== id));
  }, []);

  const updateHeader = useCallback(
    (id: string, field: 'key' | 'value', val: string) => {
      setHeaders(prev =>
        prev.map(h => (h.id === id ? {...h, [field]: val} : h)),
      );
    },
    [],
  );

  const handleConnect = useCallback(() => {
    const auth: AuthConfig = {
      type: authType,
      bearerToken,
      basicUsername,
      basicPassword,
      apiKeyHeader,
      apiKeyValue,
    };
    onConnect(url, auth, headers);
  }, [
    url,
    authType,
    bearerToken,
    basicUsername,
    basicPassword,
    apiKeyHeader,
    apiKeyValue,
    headers,
    onConnect,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Enter Agent Card URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleConnect();
          }}
        />
      </div>

      {/* Auth & Headers Toggle */}
      <div>
        <button
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80"
          onClick={() => setShowAuth(!showAuth)}
        >
          {showAuth ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          Authentication & Headers
        </button>

        {showAuth && (
          <div className="mt-3 space-y-4 rounded-md border border-border bg-muted/50 p-4">
            {/* Auth Type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Auth Type
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={authType}
                onChange={e =>
                  setAuthType(e.target.value as AuthConfig['type'])
                }
              >
                <option value="none">No Auth</option>
                <option value="basic">Basic Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="api-key">API Key</option>
              </select>
            </div>

            {/* Auth Inputs */}
            {authType === 'bearer' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Token
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                  placeholder="Enter your bearer token"
                  value={bearerToken}
                  onChange={e => setBearerToken(e.target.value)}
                />
              </div>
            )}

            {authType === 'basic' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Username
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Username"
                    value={basicUsername}
                    onChange={e => setBasicUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Password"
                    value={basicPassword}
                    onChange={e => setBasicPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {authType === 'api-key' && (
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Header Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g., X-API-Key"
                    value={apiKeyHeader}
                    onChange={e => setApiKeyHeader(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    API Key
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                    placeholder="Enter your API key"
                    value={apiKeyValue}
                    onChange={e => setApiKeyValue(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Custom Headers */}
            <div className="border-t border-border pt-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Custom Headers
              </label>
              <div className="space-y-2">
                {headers.map(h => (
                  <div key={h.id} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Header Name"
                      value={h.key}
                      onChange={e => updateHeader(h.id, 'key', e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Header Value"
                      value={h.value}
                      onChange={e =>
                        updateHeader(h.id, 'value', e.target.value)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeader(h.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addHeader}
              >
                <Plus className="mr-1 size-3" /> Add Header
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Connect Button */}
      <div className="flex justify-end">
        <Button onClick={handleConnect} disabled={isConnecting || !url.trim()}>
          {isConnecting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Connect
        </Button>
      </div>

      {connectionError && (
        <p className="text-sm text-destructive-foreground">{connectionError}</p>
      )}
    </div>
  );
}
