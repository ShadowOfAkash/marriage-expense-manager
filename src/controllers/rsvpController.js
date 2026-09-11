const { isLibSQL, dbGet, dbRun, readJSON, writeJSON } = require('../db');
const { formatGuest } = require('./guestsController');

async function getPublicGuestDetails(req, res) {
  const { token } = req.params;
  try {
    let guest = null;
    if (isLibSQL()) {
      const row = await dbGet('SELECT * FROM guests WHERE rsvp_token = ?', [token]);
      if (row) guest = formatGuest(row);
    } else {
      const d = readJSON();
      const item = (d.guests || []).find(g => g.rsvp_token === token);
      if (item) guest = formatGuest(item);
    }

    if (!guest) {
      return res.status(404).json({ error: 'Invitation not found or link has expired.' });
    }

    res.json({
      id: guest.id,
      name: guest.name,
      guest_type: guest.guest_type,
      dependents: guest.dependents,
      events: guest.events,
      expected_adults: guest.expected_adults,
      expected_children: guest.expected_children,
      expected_attendees: guest.expected_attendees,
      rsvp_status: guest.rsvp_status,
      rsvp_response_note: guest.rsvp_response_note,
      invitation_sent_at: guest.invitation_sent_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function submitPublicResponse(req, res) {
  const { token } = req.params;
  const { rsvp_status, expected_adults, expected_children, expected_attendees, rsvp_response_note, notes, stay_preference } = req.body || {};
  const responseNote = rsvp_response_note !== undefined ? rsvp_response_note : (notes !== undefined ? notes : '');

  if (!rsvp_status || !['Confirmed', 'Maybe', 'Declined'].includes(rsvp_status)) {
    return res.status(400).json({ error: 'Valid rsvp_status (Confirmed, Maybe, Declined) is required.' });
  }

  try {
    let guest = null;
    if (isLibSQL()) {
      const row = await dbGet('SELECT * FROM guests WHERE rsvp_token = ?', [token]);
      if (!row) return res.status(404).json({ error: 'Invitation not found.' });

      const a = expected_adults !== undefined ? Number(expected_adults) : (row.expected_adults || 1);
      const c = expected_children !== undefined ? Number(expected_children) : (row.expected_children || 0);
      const total = expected_attendees !== undefined ? Number(expected_attendees) : (a + c);
      const note = responseNote || (row.rsvp_response_note || '');
      const stay = stay_preference !== undefined ? stay_preference : (row.stay_preference || 'No need of stay');

      await dbRun(`
        UPDATE guests SET
          rsvp_status = ?,
          expected_adults = ?,
          expected_children = ?,
          expected_attendees = ?,
          rsvp_response_note = ?,
          stay_preference = ?,
          updated_at = datetime('now')
        WHERE rsvp_token = ?
      `, [rsvp_status, a, c, total, note, stay, token]);

      const updated = await dbGet('SELECT * FROM guests WHERE rsvp_token = ?', [token]);
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => g.rsvp_token === token);
      if (idx === -1) return res.status(404).json({ error: 'Invitation not found.' });

      const a = expected_adults !== undefined ? Number(expected_adults) : (d.guests[idx].expected_adults || 1);
      const c = expected_children !== undefined ? Number(expected_children) : (d.guests[idx].expected_children || 0);
      const total = expected_attendees !== undefined ? Number(expected_attendees) : (a + c);
      const note = responseNote || (d.guests[idx].rsvp_response_note || '');
      const stay = stay_preference !== undefined ? stay_preference : (d.guests[idx].stay_preference || 'No need of stay');

      d.guests[idx].rsvp_status = rsvp_status;
      d.guests[idx].expected_adults = a;
      d.guests[idx].expected_children = c;
      d.guests[idx].expected_attendees = total;
      d.guests[idx].rsvp_response_note = note;
      d.guests[idx].stay_preference = stay;
      d.guests[idx].updated_at = new Date().toISOString();
      writeJSON(d);
      guest = formatGuest(d.guests[idx]);
    }

    res.json({
      success: true,
      message: rsvp_status === 'Confirmed'
        ? 'Thank you! Your attendance has been joyfully confirmed.'
        : rsvp_status === 'Maybe'
        ? 'Thank you! Your response has been noted as tentative.'
        : 'Thank you for letting us know. We will miss you!',
      guest
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getPublicGuestDetails,
  submitPublicResponse
};
