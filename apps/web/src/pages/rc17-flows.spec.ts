import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../shared/auth', () => ({
  getAccessToken: () => 'test-token',
  getCsrfToken: () => null,
  getActiveWorkspace: () => ({ id: 'ws-test', name: 'Test' }),
  clearAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  setCsrfToken: vi.fn(),
}));

import { api } from '../shared/api';

describe('RC-17 knowledge / AI client flows', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('lists knowledge search results', async () => {
    const entries = [
      {
        id: 'k-1',
        title: 'Donchian note',
        description: 'desc',
        category: 'strategy',
        type: 'insight',
        tags: ['donchian'],
        validationStatus: 'validated',
        version: 1,
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => entries,
        text: async () => JSON.stringify(entries),
      }),
    );

    const result = await api.listKnowledge({ q: 'Donchian' });
    expect(result).toEqual(entries);
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    expect(String(url)).toContain('/v1/knowledge');
    expect(String(url)).toContain('q=Donchian');
  });

  it('AI path surfaces Experiment not found without JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () =>
          JSON.stringify({
            statusCode: 404,
            error: 'Not Found',
            message: 'Experiment missing not found',
          }),
      }),
    );

    await expect(api.getExperiment('missing')).rejects.toThrow('Experiment not found.');
  });
});
