/**
 * @jest-environment node
 */

import { pandaScoreFetch } from "../../lib/pandaScoreFetch";

const OLD_ENV = process.env;

describe('pandaScoreFetch', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    // Silence console.error in tests except when we assert
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore?.();
    (console.warn as jest.Mock).mockRestore?.();
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('adjunta el token como query param', async () => {
    process.env.PANDA_SCORE_TOKEN = 'abcd1234';

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockImplementation((input: unknown) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      expect(url).toContain('token=abcd1234');
      expect(url).toContain('per_page=1');
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    const sp = new URLSearchParams();
    sp.set('per_page', '1');
    const res = await pandaScoreFetch('https://api.pandascore.co/matches/running', sp);
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lanza error claro cuando faltan claves', async () => {
    delete process.env.PANDA_SCORE_TOKEN;
    delete process.env.PANDA_SCORE_TOKEN_FALLBACK;

    await expect(
      pandaScoreFetch('https://api.pandascore.co/matches/running')
    ).rejects.toThrow('Missing PandaScore API keys');
  });

  it('reporta y lanza error en respuestas no-429', async () => {
    process.env.PANDA_SCORE_TOKEN = 'xyz9876';

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue(
      new Response('Unauthorized', { status: 401 })
    );

    const consoleSpy = jest.spyOn(console, 'error');

    await expect(
      pandaScoreFetch('https://api.pandascore.co/matches/running')
    ).rejects.toThrow('API error: 401 - Unauthorized');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
    const args = (consoleSpy.mock.calls[0] || [])[1] as string | undefined;
    if (typeof args === 'string') {
      expect(args).toContain('pandascore');
      expect(args).toContain('401');
    }
  });

  it('intenta claves alternativas al recibir 429 y luego tiene éxito', async () => {
    process.env.PANDA_SCORE_TOKEN = 'tok1';
    process.env.PANDA_SCORE_TOKEN_FALLBACK = 'tok2';

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockImplementation((input: unknown) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      if (url.includes('token=tok1')) {
        return Promise.resolve(new Response('', { status: 429 }));
      }
      // second key succeeds
      return Promise.resolve(new Response(JSON.stringify([{ id: 1 }]), { status: 200 }));
    });

    const res = await pandaScoreFetch('https://api.pandascore.co/matches/running');
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('cachea respuestas exitosas para llamadas repetidas', async () => {
    process.env.PANDA_SCORE_TOKEN = 'cache1234';

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue(
      new Response(JSON.stringify({ foo: 'bar' }), { status: 200 })
    );

    const sp = new URLSearchParams([['per_page', '2']]);
    const res1 = await pandaScoreFetch('https://api.pandascore.co/matches/running', sp);
    expect(res1.ok).toBe(true);
    // 2nd call with identical key should hit cache and not call fetch again
    const res2 = await pandaScoreFetch('https://api.pandascore.co/matches/running', sp);
    expect(res2.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
