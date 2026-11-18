// GET /api/events -> [{ id, name, venue, startsAt, priceUgx }].
// The upstream contract does not supply stock, ownership, ticket tiers or checkout.
export function normaliseBackendEvents(rows) {
  if (!Array.isArray(rows)) throw new Error('The event service returned an unexpected response.');
  const ids = new Set();
  return rows.map((row) => {
    if (!row || !['string', 'number'].includes(typeof row.id) ||
        !/^[\w-]+$/.test(String(row.id)) || ids.has(String(row.id)) ||
        typeof row.name !== 'string' || !row.name.trim() ||
        typeof row.venue !== 'string' || !row.venue.trim() ||
        typeof row.startsAt !== 'string' || !Number.isFinite(Date.parse(row.startsAt)) ||
        !Number.isSafeInteger(row.priceUgx) || row.priceUgx < 0) {
      throw new Error('Some event details could not be loaded. Please try again shortly.');
    }
    ids.add(String(row.id));
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date(row.startsAt));
    const part = (type) => parts.find((item) => item.type === type).value;
    return {
      id: `backend-${row.id}`, upstreamId: row.id, feed: true,
      title: row.name.trim(), venue: row.venue.trim(), startsAt: row.startsAt,
      date: `${part('year')}-${part('month')}-${part('day')}`,
      category: 'Music', theme: 'orange', bookingAvailable: false,
      tickets: [{ id: 'general', name: 'General', price: row.priceUgx, available: null }],
    };
  });
}
