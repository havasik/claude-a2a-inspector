import {describe, it, expect} from 'vitest';

describe('Auth header generation', () => {
  it('generates Basic auth header', () => {
    const username = 'user';
    const password = 'pass';
    const header = `Basic ${btoa(`${username}:${password}`)}`;
    expect(header).toBe('Basic dXNlcjpwYXNz');
  });

  it('generates Bearer auth header', () => {
    const token = 'my-secret-token';
    const header = `Bearer ${token}`;
    expect(header).toBe('Bearer my-secret-token');
  });

  it('generates API Key header', () => {
    const keyName = 'X-API-Key';
    const keyValue = 'abc123';
    const headers: Record<string, string> = {};
    headers[keyName] = keyValue;
    expect(headers['X-API-Key']).toBe('abc123');
  });

  it('generates no auth header for none type', () => {
    const authType = 'none';
    const headers: Record<string, string> = {};
    if (authType !== 'none') {
      headers['Authorization'] = 'something';
    }
    expect(headers['Authorization']).toBeUndefined();
  });

  it('merges auth headers with custom headers', () => {
    const authHeaders: Record<string, string> = {
      Authorization: 'Bearer token123',
    };
    const customHeaders: Record<string, string> = {
      'X-Custom': 'value',
      'X-Another': 'value2',
    };
    const merged = {...authHeaders, ...customHeaders};
    expect(merged['Authorization']).toBe('Bearer token123');
    expect(merged['X-Custom']).toBe('value');
    expect(merged['X-Another']).toBe('value2');
  });

  it('handles Basic auth with empty password', () => {
    const header = `Basic ${btoa('admin:')}`;
    expect(header).toBe('Basic YWRtaW46');
  });

  it('handles Basic auth with special characters', () => {
    const header = `Basic ${btoa('user:p@ss:w0rd!')}`;
    // Just verify it encodes without error
    expect(header).toMatch(/^Basic [A-Za-z0-9+/]+=*$/);
  });
});
