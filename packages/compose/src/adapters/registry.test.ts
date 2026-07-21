import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromRegistry } from './registry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const META = {
  id: 'tool-123',
  name: 'getWeather',
  description: 'Get the weather',
  inputSchema: { type: 'object', properties: { city: { type: 'string' } } },
  package: { npmPackageName: '@tpmjs/weather' },
};

let fetchSpy: ReturnType<typeof vi.fn>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function isSearch(url: string): boolean {
  return url.includes('/api/tools/search');
}

/** Route search vs execute so a single fromRegistry(...).execute(...) works. */
function mockRegistry(opts: { search?: () => Response; exec?: () => Response } = {}) {
  const search = opts.search ?? (() => json({ data: [META] }));
  const exec = opts.exec ?? (() => json({ result: 'ok' }));
  fetchSpy.mockImplementation(async (input: unknown) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    return isSearch(url) ? search() : exec();
  });
}

type Executable = (input: Record<string, unknown>) => Promise<unknown>;

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fromRegistry', () => {
  describe('toolId parsing', () => {
    it('throws when the toolId has no "::" separator', async () => {
      await expect(fromRegistry('no-separator')).rejects.toThrow(/Expected format/);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('throws when the package name is empty', async () => {
      await expect(fromRegistry('::getWeather')).rejects.toThrow(
        /Both package name and tool name are required/
      );
    });

    it('throws when the tool name is empty', async () => {
      await expect(fromRegistry('@tpmjs/weather::')).rejects.toThrow(
        /Both package name and tool name are required/
      );
    });
  });

  describe('metadata fetch', () => {
    it('queries the search API with the right params and returns a tool', async () => {
      mockRegistry();
      const tool = await fromRegistry('@tpmjs/weather::getWeather');

      const searchCall = fetchSpy.mock.calls.find((c) => isSearch(String(c[0])));
      expect(searchCall).toBeDefined();
      const url = new URL(String(searchCall![0]));
      expect(url.pathname).toBe('/api/tools/search');
      expect(url.origin).toBe('https://tpmjs.com');
      expect(url.searchParams.get('q')).toBe('getWeather');
      expect(url.searchParams.get('package')).toBe('@tpmjs/weather');
      expect(url.searchParams.get('limit')).toBe('1');

      expect(tool.description).toBe('Get the weather');
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.execute).toBe('function');
    });

    it('accepts the alternate { tools: [...] } response shape', async () => {
      mockRegistry({ search: () => json({ tools: [META] }) });
      const tool = await fromRegistry('@tpmjs/weather::getWeather');
      expect(tool.description).toBe('Get the weather');
    });

    it('honors a custom apiUrl for the search request', async () => {
      mockRegistry();
      await fromRegistry('@tpmjs/weather::getWeather', { apiUrl: 'https://registry.example.com' });
      const searchCall = fetchSpy.mock.calls.find((c) => isSearch(String(c[0])));
      expect(new URL(String(searchCall![0])).origin).toBe('https://registry.example.com');
    });

    it('throws when the search request is not ok', async () => {
      mockRegistry({
        search: () => new Response('nope', { status: 502, statusText: 'Bad Gateway' }),
      });
      await expect(fromRegistry('@tpmjs/weather::getWeather')).rejects.toThrow(
        /Failed to fetch tool/
      );
    });

    it('throws when no matching tool is found', async () => {
      mockRegistry({ search: () => json({ data: [] }) });
      await expect(fromRegistry('@tpmjs/weather::getWeather')).rejects.toThrow(
        /not found in the TPMJS registry/
      );
    });

    it('throws when the result package does not match the requested one', async () => {
      mockRegistry({
        search: () => json({ data: [{ ...META, package: { npmPackageName: '@other/pkg' } }] }),
      });
      await expect(fromRegistry('@tpmjs/weather::getWeather')).rejects.toThrow(/not found/);
    });

    it('falls back to an empty object schema when the tool has no inputSchema', async () => {
      mockRegistry({ search: () => json({ data: [{ ...META, inputSchema: null }] }) });
      const tool = await fromRegistry('@tpmjs/weather::getWeather');
      expect(tool.inputSchema).toBeDefined();
    });
  });

  describe('execute()', () => {
    it('POSTs {input} to the default executor URL', async () => {
      mockRegistry();
      const tool = await fromRegistry('@tpmjs/weather::getWeather');
      const result = await (tool.execute as Executable)({ city: 'Paris' });

      expect(result).toEqual({ result: 'ok' });
      const execCall = fetchSpy.mock.calls.find((c) => !isSearch(String(c[0])));
      expect(execCall![0]).toBe('https://tpmjs.com/api/tools/tool-123/execute');
      const init = execCall![1] as {
        method: string;
        body: string;
        headers: Record<string, string>;
      };
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ input: { city: 'Paris' } });
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.headers['X-Tool-Env']).toBeUndefined();
    });

    it('adds the X-Tool-Env header when env is provided', async () => {
      mockRegistry();
      const tool = await fromRegistry('@tpmjs/weather::getWeather', {
        env: { WEATHER_API_KEY: 'secret' },
      });
      await (tool.execute as Executable)({ city: 'Paris' });

      const execCall = fetchSpy.mock.calls.find((c) => !isSearch(String(c[0])));
      const init = execCall![1] as { headers: Record<string, string> };
      expect(JSON.parse(init.headers['X-Tool-Env']!)).toEqual({ WEATHER_API_KEY: 'secret' });
    });

    it('uses a custom executorUrl when provided', async () => {
      mockRegistry();
      const tool = await fromRegistry('@tpmjs/weather::getWeather', {
        executorUrl: 'https://exec.example.com/run',
      });
      await (tool.execute as Executable)({ city: 'Paris' });

      const execCall = fetchSpy.mock.calls.find(
        (c) => String(c[0]) === 'https://exec.example.com/run'
      );
      expect(execCall).toBeDefined();
    });

    it('throws with the error text when execution fails', async () => {
      mockRegistry({ exec: () => new Response('boom', { status: 500 }) });
      const tool = await fromRegistry('@tpmjs/weather::getWeather');
      await expect((tool.execute as Executable)({ city: 'Paris' })).rejects.toThrow(
        /Tool execution failed: boom/
      );
    });
  });
});
