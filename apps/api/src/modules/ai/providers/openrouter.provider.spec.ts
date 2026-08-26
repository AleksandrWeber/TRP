import { describe, expect, it, vi, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { OpenRouterProvider } from './openrouter.provider';

describe('OpenRouterProvider.probeConnectivity (W2-S05-a)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function provider() {
    return new OpenRouterProvider({
      get: (key: string) =>
        key === 'OPENROUTER_BASE_URL' ? 'https://openrouter.ai/api/v1' : undefined,
    } as ConfigService);
  }

  it('returns authenticated for HTTP 200 without calling chat completions', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => {
      expect(_url).toBe('https://openrouter.ai/api/v1/auth/key');
      return { status: 200, ok: true };
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(provider().probeConnectivity('sk-or-test')).resolves.toBe('authenticated');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.method).toBe('GET');
    expect(init?.body).toBeUndefined();
  });

  it('maps 401 to authentication_failed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 401, ok: false })),
    );
    await expect(provider().probeConnectivity('sk-or-bad')).resolves.toBe('authentication_failed');
  });

  it('maps network failure to provider_unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );
    await expect(provider().probeConnectivity('sk-or-test')).resolves.toBe('provider_unavailable');
  });
});

describe('OpenRouterProvider.completeWithKey (W2-S05-b)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function provider() {
    return new OpenRouterProvider({
      get: (key: string) => {
        if (key === 'OPENROUTER_BASE_URL') return 'https://openrouter.ai/api/v1';
        if (key === 'OPENROUTER_MODEL') return 'openai/gpt-4o-mini';
        return undefined;
      },
    } as ConfigService);
  }

  it('completes with a caller-supplied key without reading env', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(_url).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer sk-or-vault');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'one response' } }],
          model: 'openai/gpt-4o-mini',
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      provider().completeWithKey('sk-or-vault', 'system', 'user prompt'),
    ).resolves.toEqual({ content: 'one response', model: 'openai/gpt-4o-mini' });
  });

  it('maps 401 to authentication_failed without leaking the key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 401 })),
    );
    await expect(provider().completeWithKey('sk-or-bad', 's', 'u')).rejects.toMatchObject({
      kind: 'authentication_failed',
    });
  });
});
