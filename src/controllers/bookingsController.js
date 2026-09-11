const { isLibSQL, dbGet, dbAll, dbRun, readJSON, writeJSON } = require('../db');

async function listBookings(req, res) {
  try {
    if (isLibSQL()) {
      const rows = await dbAll('SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC', [req.user.uid]);
      return res.json(rows);
    }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    res.json([...d.bookings].filter(b => b.user_id === req.user.uid || !b.user_id || b.user_id === 'legacy_user').reverse());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createBooking(req, res) {
  const { vendor, service, category, booking_date, event_date, amount, advance, status, notes } = req.body;
  if (!vendor || !service) return res.status(400).json({ error: 'Vendor and service required' });
  const finalCategory = category || 'Miscellaneous';

  try {
    if (isLibSQL()) {
      const result = await dbRun(
        'INSERT INTO bookings (user_id, vendor, service, category, booking_date, event_date, amount, advance, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.uid, vendor, service, finalCategory, booking_date || '', event_date || '', Number(amount) || 0, Number(advance) || 0, status || 'Pending', notes || '']
      );
      const row = await dbGet('SELECT * FROM bookings WHERE id = ?', [Number(result.lastInsertRowid)]);
      return res.status(201).json(row || {
        id: Number(result.lastInsertRowid),
        user_id: req.user.uid,
        vendor,
        service,
        category: finalCategory,
        booking_date,
        event_date,
        amount: Number(amount) || 0,
        advance: Number(advance) || 0,
        status: status || 'Pending',
        notes
      });
    }

    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const newBooking = {
      id: Date.now(),
      user_id: req.user.uid,
      vendor,
      service,
      category: finalCategory,
      booking_date: booking_date || '',
      event_date: event_date || '',
      amount: Number(amount) || 0,
      advance: Number(advance) || 0,
      status: status || 'Pending',
      notes: notes || ''
    };
    d.bookings.push(newBooking);
    writeJSON(d);
    res.status(201).json(newBooking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updateBooking(req, res) {
  const id = parseInt(req.params.id);
  const { vendor, service, category, booking_date, event_date, amount, advance, status, notes } = req.body;

  try {
    if (isLibSQL()) {
      await dbRun(
        'UPDATE bookings SET vendor=?, service=?, category=?, booking_date=?, event_date=?, amount=?, advance=?, status=?, notes=? WHERE id=? AND user_id=?',
        [vendor, service, category || 'Miscellaneous', booking_date, event_date, Number(amount) || 0, Number(advance) || 0, status, notes, id, req.user.uid]
      );
      return res.json({ success: true });
    }

    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    d.bookings[idx] = {
      ...d.bookings[idx],
      vendor,
      service,
      category: category || d.bookings[idx].category || 'Miscellaneous',
      booking_date,
      event_date,
      amount: Number(amount) || 0,
      advance: Number(advance) || 0,
      status,
      notes
    };
    writeJSON(d);
    res.json(d.bookings[idx]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function deleteBooking(req, res) {
  const id = parseInt(req.params.id);
  try {
    if (isLibSQL()) {
      await dbRun('DELETE FROM bookings WHERE id = ?', [id]);
      return res.json({ success: true });
    }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.bookings.splice(idx, 1);
    writeJSON(d);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking
};
