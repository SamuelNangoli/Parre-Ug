const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const events = [
  {
    id: 1,
    name: 'Kampala Live Night',
    venue: 'Demo Arena',
    startsAt: '2026-12-12T18:00:00+03:00',
    priceUgx: 50000,
  },
  {
    id: 2,
    name: 'Mukono Music Festival',
    venue: 'Demo Grounds',
    startsAt: '2026-12-19T16:00:00+03:00',
    priceUgx: 35000,
  },
];

app.get('/api/events', (req, res) => {
  res.json(events);
});

app.listen(3000, () => {
  console.log('Parre backend running on port 3000');
});
