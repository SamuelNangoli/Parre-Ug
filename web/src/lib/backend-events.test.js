import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseBackendEvents } from './backend-events.js';

const event = { id: 1, name: 'Kampala Live Night', venue: 'Demo Arena', startsAt: '2026-12-12T18:00:00+03:00', priceUgx: 50000 };

test('maps the public backend array without inventing booking capacity or VIP prices', () => {
  const [result] = normaliseBackendEvents([event]);
  assert.equal(result.id, 'backend-1');
  assert.equal(result.upstreamId, 1);
  assert.equal(result.title, event.name);
  assert.equal(result.venue, event.venue);
  assert.equal(result.date, '2026-12-12');
  assert.equal(result.tickets.length, 1);
  assert.equal(result.tickets[0].price, 50000);
  assert.equal(result.tickets[0].available, null);
  assert.equal(result.bookingAvailable, false);
  assert.deepEqual(normaliseBackendEvents([]), []);
});

test('dates use Kampala time across a UTC midnight boundary', () => {
  assert.equal(normaliseBackendEvents([{ ...event, startsAt: '2026-12-12T22:30:00Z' }])[0].date, '2026-12-13');
});

test('rejects malformed responses, duplicate IDs, invalid dates and unsafe UGX values', () => {
  for (const payload of [{ events: [event] }, null, [event, event], [{ ...event, id: '../1' }], [{ ...event, name: '' }], [{ ...event, startsAt: 'invalid' }], [{ ...event, priceUgx: '50000' }], [{ ...event, priceUgx: -1 }], [{ ...event, priceUgx: 50.25 }], [{ ...event, priceUgx: Number.MAX_SAFE_INTEGER + 1 }]]) {
    assert.throws(() => normaliseBackendEvents(payload));
  }
});
