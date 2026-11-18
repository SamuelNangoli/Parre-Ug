INSERT INTO events (id, name, venue, starts_at, price_ugx)
VALUES
  (1, 'Kampala Live Night', 'Demo Arena', '2026-12-12 15:00:00', 50000),
  (2, 'Mukono Music Festival', 'Demo Grounds', '2026-12-19 13:00:00', 35000)
ON DUPLICATE KEY UPDATE id = events.id;
