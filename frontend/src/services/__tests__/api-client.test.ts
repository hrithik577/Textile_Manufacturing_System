import test from 'node:test';
import assert from 'node:assert';
import { request, ApiError } from '../api-client.ts';

// Mock global localStorage
const mockStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, val: string) => mockStorage.set(key, val),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

test('API Client - propagates HTTP 400/401/403/404/422/500 without fixture fallback', async () => {
  const originalFetch = globalThis.fetch;
  const statuses = [400, 401, 403, 404, 409, 422, 500];

  try {
    for (const status of statuses) {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ detail: `Error status ${status}` }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        });

      const fallback = [{ id: 1, name: 'Fallback Fixture' }];

      await assert.rejects(
        async () => {
          await request('/test-endpoint', { method: 'GET' }, fallback);
        },
        (err: any) => {
          assert(err instanceof ApiError);
          assert.strictEqual(err.status, status);
          assert.strictEqual(err.message, `Error status ${status}`);
          assert.strictEqual(err.isNetworkError, false);
          assert.strictEqual(err.isTimeout, false);
          return true;
        }
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API Client - distinguishes network failure with 503 and isNetworkError flag', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch (DNS / Connection Refused)');
    };

    await assert.rejects(
      async () => {
        await request('/inventory', { method: 'GET', allowReadFallback: false }, [{ id: 99 }]);
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.strictEqual(err.status, 503);
        assert.strictEqual(err.isNetworkError, true);
        assert.strictEqual(err.isTimeout, false);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API Client - distinguishes request timeout with 504 and isTimeout flag', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options: any) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        }
      });
    };

    await assert.rejects(
      async () => {
        await request('/slow-operation', { method: 'GET', timeoutMs: 20, allowReadFallback: false });
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.strictEqual(err.status, 504);
        assert.strictEqual(err.isTimeout, true);
        assert.strictEqual(err.isNetworkError, false);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API Client - mutations (POST/PUT/PATCH/DELETE) never fall back on failure', async () => {
  const originalFetch = globalThis.fetch;
  const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  try {
    for (const method of methods) {
      globalThis.fetch = async () => {
        throw new TypeError('Backend offline');
      };

      const fallbackMutationData = { success: true, fakeId: '123' };

      await assert.rejects(
        async () => {
          await request('/orders', { method, body: JSON.stringify({ item: 'roll' }) }, fallbackMutationData);
        },
        (err: any) => {
          assert(err instanceof ApiError);
          assert.strictEqual(err.status, 503);
          return true;
        }
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API Client - explicit demo mode returns simulated fallback data', async () => {
  mockStorage.set('everest_force_demo', 'true');
  try {
    const fallback = { simulated: true, role: 'manager' };
    const result = await request('/config', { method: 'GET' }, fallback);

    assert.strictEqual(result.isSimulated, true);
    assert.deepStrictEqual(result.data, fallback);
  } finally {
    mockStorage.delete('everest_force_demo');
  }
});
