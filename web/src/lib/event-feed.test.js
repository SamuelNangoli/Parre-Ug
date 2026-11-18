import test from 'node:test';
import assert from 'node:assert/strict';
import { shop } from '../services/api.js';

const upstream = [{ id: 2, name: 'Mukono Music Festival', venue: 'Demo Grounds', startsAt: '2026-12-19T13:00:00Z', priceUgx: 35000 }];
const local = { id: 'evt-local', title: 'Locally managed event', tickets: [] };
async function withResponses(responses, check) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    const response = responses[url];
    if (response instanceof Error) throw response;
    return new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json' } });
  };
  try { await check(await shop.events(), calls); }
  finally { globalThis.fetch = original; }
}

test('reads the upstream public array and keeps local checkout events separate', async () => {
  await withResponses({ '/api/events': upstream, '/api/local-events': { events: [local] } }, (result, calls) => {
    assert.deepEqual(calls.map(item => item.url).sort(), ['/api/events', '/api/local-events']);
    assert.equal(result.events[0].id, 'backend-2');
    assert.equal(result.events[0].tickets[0].price, 35000);
    assert.equal(result.events[0].bookingAvailable, false);
    assert.ok(result.events.some(item => item.id === local.id));
    assert.equal(result.feedError, '');
    assert.ok(calls.every(item => !('Authorization' in item.options.headers)));
  });
});

test('failed or malformed upstream feeds show an explicit notice and preserve working local listings', async () => {
  for (const response of [new Error('offline'), { events: upstream }]) {
    await withResponses({ '/api/events': response, '/api/local-events': { events: [local] } }, (result) => {
      assert.ok(result.feedError);
      assert.equal(result.localError, '');
      assert.ok(result.events.some(item => item.id === local.id));
      assert.ok(!result.events.some(item => item.feed));
    });
  }
});

test('a failed local adapter does not hide working upstream event listings', async () => {
  await withResponses({ '/api/events': upstream, '/api/local-events': new Error('offline') }, (result) => {
    assert.equal(result.feedError, '');
    assert.ok(result.localError);
    assert.equal(result.events[0].id, 'backend-2');
  });
});
