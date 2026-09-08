const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

if (!code.includes('/api/bookings')) {
  const bookingsApi = `
// ═══════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/bookings', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      const rows = await dbAll('SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC', [req.user.uid]);
      return res.json(rows);
    }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    res.json([...d.bookings].filter(b => b.user_id === req.user.uid || !b.user_id || b.user_id === 'legacy_user').reverse());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bookings', requireAuth, async (req, res) => {
  const { vendor, service, booking_date, event_date, amount, advance, status, notes } = req.body;
  if (!vendor || !service) return res.status(400).json({ error: 'Vendor and service required' });
  try {
    if (useLibSQL) {
      const result = await dbRun(
        'INSERT INTO bookings (user_id, vendor, service, booking_date, event_date, amount, advance, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.uid, vendor, service, booking_date || '', event_date || '', Number(amount)||0, Number(advance)||0, status || 'Pending', notes || '']
      );
      return res.json({ id: result.lastInsertRowid, success: true });
    }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const newBooking = { id: Date.now(), user_id: req.user.uid, vendor, service, booking_date: booking_date||'', event_date: event_date||'', amount: Number(amount)||0, advance: Number(advance)||0, status: status||'Pending', notes: notes||'' };
    d.bookings.push(newBooking);
    writeJSON(d);
    res.json(newBooking);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/bookings/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { vendor, service, booking_date, event_date, amount, advance, status, notes } = req.body;
  try {
    if (useLibSQL) {
      await dbRun(
        'UPDATE bookings SET vendor=?, service=?, booking_date=?, event_date=?, amount=?, advance=?, status=?, notes=? WHERE id=? AND user_id=?',
        [vendor, service, booking_date, event_date, Number(amount)||0, Number(advance)||0, status, notes, id, req.user.uid]
      );
      return res.json({ success: true });
    }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.bookings[idx] = { ...d.bookings[idx], vendor, service, booking_date, event_date, amount: Number(amount)||0, advance: Number(advance)||0, status, notes };
    writeJSON(d);
    res.json(d.bookings[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/bookings/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (useLibSQL) { await dbRun('DELETE FROM bookings WHERE id = ?', [id]); return res.json({ success: true }); }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.bookings.splice(idx, 1);
    writeJSON(d);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// SAVINGS
`;
  code = code.replace(/\/\/ ═══════════════════════════════════════════════════════════════════════════\n\/\/ SAVINGS/g, bookingsApi);
  fs.writeFileSync('server.js', code);
  console.log("Patched server.js with Bookings API");
} else {
  console.log("Bookings API already exists");
}
