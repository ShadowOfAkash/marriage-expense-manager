const { isLibSQL, dbGet, dbAll, dbRun, readJSON, writeJSON, generateRsvpToken } = require('../db');
const { getPublicBaseUrl, sendInvitationEmail, getUserEmailConfig } = require('../services/emailService');
const { generateInvitationPDF } = require('../services/pdfService');
const { generateTelegramInvitationText, sendTelegramReply, sendTelegramDocument } = require('../services/telegramService');

function formatGuest(g) {
  if (!g) return null;
  const token = g.rsvp_token || generateRsvpToken(g.id);
  return {
    ...g,
    rsvp_token: token,
    invitation_sent_at: g.invitation_sent_at || null,
    invitation_channel: g.invitation_channel || null,
    telegram_chat_id: g.telegram_chat_id || null,
    rsvp_response_note: g.rsvp_response_note || '',
    stay_preference: g.stay_preference || 'No need of stay',
    tags: typeof g.tags === 'string' ? JSON.parse(g.tags || '[]') : (g.tags || []),
    events: typeof g.events === 'string' ? JSON.parse(g.events || '[]') : (g.events || []),
    dependents: typeof g.dependents === 'string' ? JSON.parse(g.dependents || '[]') : (Array.isArray(g.dependents) ? g.dependents : []),
    plus_one_allowed: Boolean(g.plus_one_allowed),
    check_in_status: Boolean(g.check_in_status),
    expected_adults: Number(g.expected_adults) || 1,
    expected_children: Number(g.expected_children) || 0,
    expected_attendees: Number(g.expected_attendees) || (Number(g.expected_adults) || 1) + (Number(g.expected_children) || 0),
    actual_attendees: Number(g.actual_attendees) || 0
  };
}

async function listGuests(req, res) {
  try {
    const { search, side, relationship_category, rsvp_status, actual_attendance, event, household_name } = req.query;
    let guests = [];

    if (isLibSQL()) {
      const rows = await dbAll('SELECT * FROM guests WHERE user_id = ? ORDER BY id DESC', [req.user.uid]);
      guests = rows.map(formatGuest);
    } else {
      const d = readJSON();
      if (!d.guests) d.guests = [];
      guests = d.guests
        .filter(g => g.user_id === req.user.uid || !g.user_id || g.user_id === 'legacy_user')
        .map(formatGuest)
        .reverse();
    }

    // In-memory filters
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      guests = guests.filter(g => 
        (g.name && g.name.toLowerCase().includes(q)) ||
        (g.guest_id && g.guest_id.toLowerCase().includes(q)) ||
        (g.phone && g.phone.toLowerCase().includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        (g.household_name && g.household_name.toLowerCase().includes(q)) ||
        (g.relationship_detail && g.relationship_detail.toLowerCase().includes(q)) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    if (side && side !== 'All') {
      guests = guests.filter(g => g.side === side || (side === 'Both' && (g.side === 'Both' || g.side === 'Bride/Groom')));
    }
    if (relationship_category && relationship_category !== 'All') {
      guests = guests.filter(g => g.relationship_category === relationship_category);
    }
    if (rsvp_status && rsvp_status !== 'All') {
      guests = guests.filter(g => g.rsvp_status === rsvp_status);
    }
    if (actual_attendance && actual_attendance !== 'All') {
      guests = guests.filter(g => g.actual_attendance === actual_attendance);
    }
    if (event && event !== 'All') {
      guests = guests.filter(g => g.events && g.events.includes(event));
    }
    if (household_name) {
      guests = guests.filter(g => g.household_name === household_name);
    }

    res.json(guests);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getSummary(req, res) {
  try {
    let guests = [];
    if (isLibSQL()) {
      const rows = await dbAll('SELECT * FROM guests WHERE user_id = ?', [req.user.uid]);
      guests = rows.map(formatGuest);
    } else {
      const d = readJSON();
      if (!d.guests) d.guests = [];
      guests = d.guests
        .filter(g => g.user_id === req.user.uid || !g.user_id || g.user_id === 'legacy_user')
        .map(formatGuest);
    }

    const totalGuests = guests.length;
    let invited = 0;
    let confirmed = 0;
    let maybe = 0;
    let declined = 0;
    let noResponse = 0;
    let expectedAttendance = 0;
    let actuallyAttended = 0;

    const sideBreakdown = { bride: 0, groom: 0, both: 0 };
    const categoryBreakdown = { family: 0, friend: 0, colleague: 0, other: 0 };
    const foodBreakdown = { veg: 0, nonVeg: 0, jain: 0, vegan: 0, other: 0 };
    const eventBreakdown = { Mehendi: 0, Haldi: 0, Sangeet: 0, Wedding: 0 };

    guests.forEach(g => {
      const rsvp = (g.rsvp_status === 'Not Responded' || !g.rsvp_status) ? 'Pending Invitation' : g.rsvp_status;
      if (rsvp === 'Confirmed') {
        confirmed++;
        invited++;
        expectedAttendance += Number(g.expected_attendees) || 1;
      } else if (rsvp === 'Maybe') {
        maybe++;
        invited++;
        expectedAttendance += Number(g.expected_attendees) || 1;
      } else if (rsvp === 'Declined') {
        declined++;
        invited++;
      } else if (rsvp === 'Invited') {
        invited++;
      } else {
        noResponse++;
      }

      if (g.actual_attendance === 'Attended' || g.check_in_status) {
        actuallyAttended += Number(g.actual_attendees) || Number(g.expected_attendees) || 1;
      }

      const s = (g.side || '').toLowerCase();
      if (s.includes('bride')) sideBreakdown.bride++;
      else if (s.includes('groom')) sideBreakdown.groom++;
      else sideBreakdown.both++;

      const cat = (g.relationship_category || '').toLowerCase();
      if (cat.includes('fam')) categoryBreakdown.family++;
      else if (cat.includes('friend')) categoryBreakdown.friend++;
      else if (cat.includes('colleague') || cat.includes('office') || cat.includes('work')) categoryBreakdown.colleague++;
      else categoryBreakdown.other++;

      const food = (g.food_preference || '').toLowerCase();
      if (food.includes('non')) foodBreakdown.nonVeg++;
      else if (food.includes('jain')) foodBreakdown.jain++;
      else if (food.includes('vegan')) foodBreakdown.vegan++;
      else if (food.includes('veg')) foodBreakdown.veg++;
      else foodBreakdown.other++;

      if (Array.isArray(g.events)) {
        g.events.forEach(ev => {
          if (eventBreakdown[ev] !== undefined) {
            eventBreakdown[ev]++;
          }
        });
      }
    });

    res.json({
      totalGuests,
      invited,
      confirmed,
      maybe,
      declined,
      noResponse,
      expectedAttendance,
      actuallyAttended,
      sideBreakdown,
      categoryBreakdown,
      foodBreakdown,
      eventBreakdown
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createGuest(req, res) {
  const {
    name, phone, email, gender, age_group, side,
    relationship_category, relationship_detail, guest_type,
    household_name, household_role, plus_one_allowed, plus_one_name,
    rsvp_status, expected_adults, expected_children, expected_attendees,
    actual_attendance, actual_attendees, check_in_status,
    food_preference, special_requirements, notes, tags, events, dependents,
    stay_preference
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Guest name is required' });
  }

  const expAdults = Number(expected_adults) !== undefined && !isNaN(Number(expected_adults)) ? Number(expected_adults) : 1;
  const expChildren = Number(expected_children) || 0;
  const expTotal = Number(expected_attendees) || (expAdults + expChildren);
  const actAttendees = Number(actual_attendees) || 0;
  const tagsJSON = JSON.stringify(Array.isArray(tags) ? tags : []);
  const eventsJSON = JSON.stringify(Array.isArray(events) && events.length ? events : ['Mehendi', 'Haldi', 'Wedding']);
  const dependentsJSON = JSON.stringify(Array.isArray(dependents) ? dependents : []);
  const checkIn = check_in_status ? 1 : 0;
  const checkInTime = checkIn ? new Date().toISOString() : null;
  const stayPref = stay_preference || 'No need of stay';

  try {
    if (isLibSQL()) {
      const countRow = await dbGet('SELECT COUNT(*) as count FROM guests');
      const nextNum = (countRow?.count || 0) + 1001;
      const guestId = `GST-${nextNum}`;

      const result = await dbRun(`
        INSERT INTO guests (
          guest_id, user_id, name, phone, email, gender, age_group, side,
          relationship_category, relationship_detail, guest_type,
          household_name, household_role, plus_one_allowed, plus_one_name,
          rsvp_status, expected_adults, expected_children, expected_attendees,
          actual_attendance, actual_attendees, check_in_status, check_in_time,
          food_preference, special_requirements, notes, tags, events, dependents,
          stay_preference, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        guestId, req.user.uid, name.trim(), phone || '', email || '', gender || '', age_group || 'Adult',
        side || 'Bride', relationship_category || 'Family', relationship_detail || '', guest_type || 'Individual',
        household_name || '', household_role || 'Primary', plus_one_allowed ? 1 : 0, plus_one_name || '',
        rsvp_status || 'Pending Invitation', expAdults, expChildren, expTotal,
        actual_attendance || 'Pending', actAttendees, checkIn, checkInTime,
        food_preference || 'Vegetarian', special_requirements || '', notes || '',
        tagsJSON, eventsJSON, dependentsJSON, stayPref
      ]);

      const inserted = await dbGet('SELECT * FROM guests WHERE id = ?', [Number(result.lastInsertRowid)]);
      return res.status(201).json(formatGuest(inserted));
    }

    const d = readJSON();
    if (!d.guests) d.guests = [];
    const nextNum = d._nextGuestId ? d._nextGuestId++ : (d.guests.length + 1001);
    const guestId = `GST-${nextNum}`;
    const newId = Date.now();

    const newGuest = {
      id: newId,
      guest_id: guestId,
      user_id: req.user.uid,
      name: name.trim(),
      phone: phone || '',
      email: email || '',
      gender: gender || '',
      age_group: age_group || 'Adult',
      side: side || 'Bride',
      relationship_category: relationship_category || 'Family',
      relationship_detail: relationship_detail || '',
      guest_type: guest_type || 'Individual',
      household_name: household_name || '',
      household_role: household_role || 'Primary',
      plus_one_allowed: Boolean(plus_one_allowed),
      plus_one_name: plus_one_name || '',
      rsvp_status: rsvp_status || 'Pending Invitation',
      rsvp_token: generateRsvpToken(newId),
      stay_preference: stayPref,
      expected_adults: expAdults,
      expected_children: expChildren,
      expected_attendees: expTotal,
      actual_attendance: actual_attendance || 'Pending',
      actual_attendees: actAttendees,
      check_in_status: Boolean(checkIn),
      check_in_time: checkInTime,
      food_preference: food_preference || 'Vegetarian',
      special_requirements: special_requirements || '',
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : [],
      events: Array.isArray(events) && events.length ? events : ['Mehendi', 'Haldi', 'Wedding'],
      dependents: Array.isArray(dependents) ? dependents : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    d.guests.push(newGuest);
    writeJSON(d);
    res.status(201).json(formatGuest(newGuest));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updateGuest(req, res) {
  const id = parseInt(req.params.id);
  const {
    name, phone, email, gender, age_group, side,
    relationship_category, relationship_detail, guest_type,
    household_name, household_role, plus_one_allowed, plus_one_name,
    rsvp_status, expected_adults, expected_children, expected_attendees,
    actual_attendance, actual_attendees, check_in_status,
    food_preference, special_requirements, notes, tags, events, dependents,
    stay_preference
  } = req.body;

  const expAdults = Number(expected_adults) !== undefined && !isNaN(Number(expected_adults)) ? Number(expected_adults) : 1;
  const expChildren = Number(expected_children) || 0;
  const expTotal = Number(expected_attendees) || (expAdults + expChildren);
  const actAttendees = Number(actual_attendees) || 0;
  const tagsJSON = JSON.stringify(Array.isArray(tags) ? tags : []);
  const eventsJSON = JSON.stringify(Array.isArray(events) ? events : []);
  const dependentsJSON = JSON.stringify(Array.isArray(dependents) ? dependents : []);
  const checkIn = check_in_status ? 1 : 0;
  const checkInTime = checkIn ? (req.body.check_in_time || new Date().toISOString()) : null;

  try {
    if (isLibSQL()) {
      await dbRun(`
        UPDATE guests SET
          name = ?, phone = ?, email = ?, gender = ?, age_group = ?, side = ?,
          relationship_category = ?, relationship_detail = ?, guest_type = ?,
          household_name = ?, household_role = ?, plus_one_allowed = ?, plus_one_name = ?,
          rsvp_status = ?, expected_adults = ?, expected_children = ?, expected_attendees = ?,
          actual_attendance = ?, actual_attendees = ?, check_in_status = ?, check_in_time = ?,
          food_preference = ?, special_requirements = ?, notes = ?, tags = ?, events = ?, dependents = ?,
          stay_preference = COALESCE(?, stay_preference),
          updated_at = datetime('now')
        WHERE id = ? AND (user_id = ? OR user_id = 'legacy_user' OR user_id IS NULL OR user_id = '')
      `, [
        name, phone || '', email || '', gender || '', age_group || 'Adult', side || 'Bride',
        relationship_category || 'Family', relationship_detail || '', guest_type || 'Individual',
        household_name || '', household_role || 'Primary', plus_one_allowed ? 1 : 0, plus_one_name || '',
        rsvp_status || 'Pending Invitation', expAdults, expChildren, expTotal,
        actual_attendance || 'Pending', actAttendees, checkIn, checkInTime,
        food_preference || 'Vegetarian', special_requirements || '', notes || '',
        tagsJSON, eventsJSON, dependentsJSON, stay_preference !== undefined ? stay_preference : null,
        id, req.user.uid
      ]);

      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      if (!updated) return res.status(404).json({ error: 'Guest not found' });
      return res.json(formatGuest(updated));
    }

    const d = readJSON();
    if (!d.guests) d.guests = [];
    const idx = d.guests.findIndex(g => g.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Guest not found' });

    d.guests[idx] = {
      ...d.guests[idx],
      name: name !== undefined ? name : d.guests[idx].name,
      phone: phone !== undefined ? phone : d.guests[idx].phone,
      email: email !== undefined ? email : d.guests[idx].email,
      gender: gender !== undefined ? gender : d.guests[idx].gender,
      age_group: age_group !== undefined ? age_group : d.guests[idx].age_group,
      side: side !== undefined ? side : d.guests[idx].side,
      relationship_category: relationship_category !== undefined ? relationship_category : d.guests[idx].relationship_category,
      relationship_detail: relationship_detail !== undefined ? relationship_detail : d.guests[idx].relationship_detail,
      guest_type: guest_type !== undefined ? guest_type : d.guests[idx].guest_type,
      household_name: household_name !== undefined ? household_name : d.guests[idx].household_name,
      household_role: household_role !== undefined ? household_role : d.guests[idx].household_role,
      plus_one_allowed: plus_one_allowed !== undefined ? Boolean(plus_one_allowed) : d.guests[idx].plus_one_allowed,
      plus_one_name: plus_one_name !== undefined ? plus_one_name : d.guests[idx].plus_one_name,
      rsvp_status: rsvp_status !== undefined ? rsvp_status : d.guests[idx].rsvp_status,
      stay_preference: stay_preference !== undefined ? stay_preference : (d.guests[idx].stay_preference || 'No need of stay'),
      expected_adults: expAdults,
      expected_children: expChildren,
      expected_attendees: expTotal,
      actual_attendance: actual_attendance !== undefined ? actual_attendance : d.guests[idx].actual_attendance,
      actual_attendees: actAttendees,
      check_in_status: Boolean(checkIn),
      check_in_time: checkInTime,
      food_preference: food_preference !== undefined ? food_preference : d.guests[idx].food_preference,
      special_requirements: special_requirements !== undefined ? special_requirements : d.guests[idx].special_requirements,
      notes: notes !== undefined ? notes : d.guests[idx].notes,
      tags: Array.isArray(tags) ? tags : d.guests[idx].tags,
      events: Array.isArray(events) ? events : d.guests[idx].events,
      dependents: Array.isArray(dependents) ? dependents : (d.guests[idx].dependents || []),
      updated_at: new Date().toISOString()
    };

    writeJSON(d);
    res.json(formatGuest(d.guests[idx]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function deleteGuest(req, res) {
  const id = parseInt(req.params.id);
  try {
    if (isLibSQL()) {
      await dbRun('DELETE FROM guests WHERE id = ? AND (user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = "")', [id, req.user.uid]);
      return res.json({ success: true });
    }
    const d = readJSON();
    if (!d.guests) d.guests = [];
    const idx = d.guests.findIndex(g => g.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Guest not found' });
    d.guests.splice(idx, 1);
    writeJSON(d);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function bulkOperations(req, res) {
  const { action, guestIds, data } = req.body;
  if (!action || !Array.isArray(guestIds) || guestIds.length === 0) {
    return res.status(400).json({ error: 'Invalid bulk action payload' });
  }

  try {
    if (isLibSQL()) {
      for (const id of guestIds) {
        if (action === 'delete') {
          await dbRun('DELETE FROM guests WHERE id = ? AND (user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = "")', [id, req.user.uid]);
        } else if (action === 'change_rsvp') {
          await dbRun('UPDATE guests SET rsvp_status = ?, updated_at = datetime("now") WHERE id = ? AND (user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = "")', [data.rsvp_status, id, req.user.uid]);
        } else if (action === 'change_stay') {
          await dbRun('UPDATE guests SET stay_preference = ?, updated_at = datetime("now") WHERE id = ? AND (user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = "")', [data.stay_preference, id, req.user.uid]);
        } else if (action === 'mark_attendance') {
          const isAttended = data.actual_attendance === 'Attended';
          await dbRun(`
            UPDATE guests SET 
              actual_attendance = ?, 
              check_in_status = ?, 
              check_in_time = ?,
              actual_attendees = CASE WHEN ? = 1 AND (actual_attendees IS NULL OR actual_attendees = 0) THEN expected_attendees ELSE actual_attendees END,
              updated_at = datetime('now')
            WHERE id = ? AND (user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = "")
          `, [data.actual_attendance, isAttended ? 1 : 0, isAttended ? new Date().toISOString() : null, isAttended ? 1 : 0, id, req.user.uid]);
        }
      }
      return res.json({ success: true, count: guestIds.length });
    }

    const d = readJSON();
    if (!d.guests) d.guests = [];

    if (action === 'delete') {
      const set = new Set(guestIds.map(Number));
      d.guests = d.guests.filter(g => !set.has(Number(g.id)));
    } else {
      d.guests.forEach(g => {
        if (guestIds.map(Number).includes(Number(g.id))) {
          if (action === 'change_rsvp') {
            g.rsvp_status = data.rsvp_status;
          } else if (action === 'change_stay') {
            g.stay_preference = data.stay_preference;
          } else if (action === 'mark_attendance') {
            g.actual_attendance = data.actual_attendance;
            const isAttended = data.actual_attendance === 'Attended';
            g.check_in_status = isAttended;
            g.check_in_time = isAttended ? new Date().toISOString() : null;
            if (isAttended && (!g.actual_attendees || g.actual_attendees === 0)) {
              g.actual_attendees = g.expected_attendees || 1;
            }
          } else if (action === 'assign_event') {
            const evs = new Set(Array.isArray(g.events) ? g.events : []);
            evs.add(data.event);
            g.events = Array.from(evs);
          } else if (action === 'remove_event') {
            g.events = (Array.isArray(g.events) ? g.events : []).filter(e => e !== data.event);
          } else if (action === 'add_tag') {
            const tgs = new Set(Array.isArray(g.tags) ? g.tags : []);
            tgs.add(data.tag);
            g.tags = Array.from(tgs);
          }
          g.updated_at = new Date().toISOString();
        }
      });
    }

    writeJSON(d);
    res.json({ success: true, count: guestIds.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function importGuests(req, res) {
  const { guests } = req.body;
  if (!Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({ error: 'No guests data provided' });
  }

  try {
    const imported = [];
    const d = readJSON();
    if (!d.guests) d.guests = [];

    for (const raw of guests) {
      if (!raw.name || !raw.name.trim()) continue;
      const nextNum = d._nextGuestId ? d._nextGuestId++ : (d.guests.length + 1001);
      const guestId = raw.guest_id || `GST-${nextNum}`;
      const expAdults = Number(raw.expected_adults) || 1;
      const expChildren = Number(raw.expected_children) || 0;
      const expTotal = Number(raw.expected_attendees) || (expAdults + expChildren);

      const guestItem = {
        id: Date.now() + Math.floor(Math.random() * 100000),
        guest_id: guestId,
        user_id: req.user.uid,
        name: raw.name.trim(),
        phone: raw.phone || '',
        email: raw.email || '',
        gender: raw.gender || '',
        age_group: raw.age_group || 'Adult',
        side: raw.side || 'Bride',
        relationship_category: raw.relationship_category || 'Family',
        relationship_detail: raw.relationship_detail || '',
        guest_type: raw.guest_type || 'Individual',
        household_name: raw.household_name || '',
        household_role: raw.household_role || 'Primary',
        plus_one_allowed: Boolean(raw.plus_one_allowed),
        plus_one_name: raw.plus_one_name || '',
        rsvp_status: (raw.rsvp_status === 'Not Responded' || !raw.rsvp_status) ? 'Pending Invitation' : raw.rsvp_status,
        stay_preference: raw.stay_preference || 'No need of stay',
        expected_adults: expAdults,
        expected_children: expChildren,
        expected_attendees: expTotal,
        actual_attendance: raw.actual_attendance || 'Pending',
        actual_attendees: Number(raw.actual_attendees) || 0,
        check_in_status: Boolean(raw.check_in_status),
        check_in_time: raw.check_in_time || null,
        food_preference: raw.food_preference || 'Vegetarian',
        special_requirements: raw.special_requirements || '',
        notes: raw.notes || '',
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        events: Array.isArray(raw.events) && raw.events.length ? raw.events : ['Mehendi', 'Haldi', 'Wedding'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isLibSQL()) {
        await dbRun(`
          INSERT INTO guests (
            guest_id, user_id, name, phone, email, gender, age_group, side,
            relationship_category, relationship_detail, guest_type,
            household_name, household_role, plus_one_allowed, plus_one_name,
            rsvp_status, expected_adults, expected_children, expected_attendees,
            actual_attendance, actual_attendees, check_in_status, check_in_time,
            food_preference, special_requirements, notes, tags, events, stay_preference, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          guestItem.guest_id, req.user.uid, guestItem.name, guestItem.phone, guestItem.email, guestItem.gender, guestItem.age_group,
          guestItem.side, guestItem.relationship_category, guestItem.relationship_detail, guestItem.guest_type,
          guestItem.household_name, guestItem.household_role, guestItem.plus_one_allowed ? 1 : 0, guestItem.plus_one_name,
          guestItem.rsvp_status, guestItem.expected_adults, guestItem.expected_children, guestItem.expected_attendees,
          guestItem.actual_attendance, guestItem.actual_attendees, guestItem.check_in_status ? 1 : 0, guestItem.check_in_time,
          guestItem.food_preference, guestItem.special_requirements, guestItem.notes,
          JSON.stringify(guestItem.tags), JSON.stringify(guestItem.events), guestItem.stay_preference
        ]);
      } else {
        d.guests.push(guestItem);
      }
      imported.push(formatGuest(guestItem));
    }

    if (!isLibSQL()) {
      writeJSON(d);
    }

    res.status(201).json({ success: true, imported: imported.length, importedCount: imported.length, guests: imported });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function patchRsvpStatus(req, res) {
  const id = parseInt(req.params.id);
  const { rsvp_status } = req.body;
  if (!rsvp_status) return res.status(400).json({ error: 'rsvp_status is required' });

  try {
    let guest;
    if (isLibSQL()) {
      await dbRun(`
        UPDATE guests SET
          rsvp_status = ?,
          updated_at = datetime('now')
        WHERE id = ? AND (user_id = ? OR user_id = 'legacy_user' OR user_id IS NULL OR user_id = '')
      `, [rsvp_status, id, req.user.uid]);
      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      if (!updated) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => Number(g.id) === Number(id));
      if (idx === -1) return res.status(404).json({ error: 'Guest not found' });
      d.guests[idx].rsvp_status = rsvp_status;
      d.guests[idx].updated_at = new Date().toISOString();
      writeJSON(d);
      guest = formatGuest(d.guests[idx]);
    }

    res.json({ success: true, guest, rsvp_status: guest.rsvp_status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function patchStayPreference(req, res) {
  const id = parseInt(req.params.id);
  const { stay_preference } = req.body;
  if (!stay_preference) return res.status(400).json({ error: 'stay_preference is required' });

  try {
    let guest;
    if (isLibSQL()) {
      await dbRun(`
        UPDATE guests SET
          stay_preference = ?,
          updated_at = datetime('now')
        WHERE id = ? AND (user_id = ? OR user_id = 'legacy_user' OR user_id IS NULL OR user_id = '')
      `, [stay_preference, id, req.user.uid]);
      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      if (!updated) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => Number(g.id) === Number(id));
      if (idx === -1) return res.status(404).json({ error: 'Guest not found' });
      d.guests[idx].stay_preference = stay_preference;
      d.guests[idx].updated_at = new Date().toISOString();
      writeJSON(d);
      guest = formatGuest(d.guests[idx]);
    }

    res.json({ success: true, guest, stay_preference: guest.stay_preference });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function sendSingleInvitation(req, res) {
  const id = parseInt(req.params.id);
  const { email, customSubject, customMessage } = req.body || {};

  try {
    let guest;
    if (isLibSQL()) {
      let row = await dbGet('SELECT * FROM guests WHERE id = ? AND (user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = "")', [id, req.user.uid]);
      if (!row) {
        row = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      }
      if (!row) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(row);
    } else {
      const d = readJSON();
      const item = (d.guests || []).find(g => g.id === id);
      if (!item) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(item);
    }

    const recipientEmail = (email || guest.email || '').trim();
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email address is required to send an invitation.' });
    }

    // Ensure token is persisted
    const token = guest.rsvp_token || generateRsvpToken(guest.id);
    guest.rsvp_token = token;
    guest.email = recipientEmail;

    const baseUrl = getPublicBaseUrl(req);
    const mailResult = await sendInvitationEmail({
      guest,
      customSubject,
      customMessage,
      baseUrl,
      userId: req.user.uid
    });

    const now = new Date().toISOString();
    if (isLibSQL()) {
      await dbRun(`
        UPDATE guests SET
          email = ?,
          rsvp_token = ?,
          rsvp_status = 'Invited',
          invitation_sent_at = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `, [recipientEmail, token, now, id]);
      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => g.id === id);
      if (idx !== -1) {
        d.guests[idx].email = recipientEmail;
        d.guests[idx].rsvp_token = token;
        d.guests[idx].rsvp_status = 'Invited';
        d.guests[idx].invitation_sent_at = now;
        d.guests[idx].updated_at = now;
        writeJSON(d);
        guest = formatGuest(d.guests[idx]);
      }
    }

    res.json({
      success: true,
      message: mailResult.isConfigured
        ? `Invitation email delivered successfully to ${recipientEmail}`
        : 'Invitation preview generated (Sandbox Mode). Real email delivery is not configured yet.',
      previewUrl: mailResult.previewUrl,
      pdfUrl: `/api/guests/${id}/invitation-pdf`,
      isTest: mailResult.isTest,
      isConfigured: mailResult.isConfigured,
      warning: mailResult.isTest
        ? 'Real email delivery not configured yet. Configure Email Delivery Settings in Guests or set GMAIL_USER and GMAIL_APP_PASSWORD in environment variables.'
        : null,
      guest
    });
  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ error: err.message || 'Failed to send invitation' });
  }
}

async function sendTelegramInvitation(req, res) {
  const id = parseInt(req.params.id);
  const { phone, customMessage } = req.body || {};

  try {
    let guest;
    if (isLibSQL()) {
      let row = await dbGet('SELECT * FROM guests WHERE id = ? AND (user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = "")', [id, req.user.uid]);
      if (!row) {
        row = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      }
      if (!row) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(row);
    } else {
      const d = readJSON();
      const item = (d.guests || []).find(g => g.id === id);
      if (!item) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(item);
    }

    const recipientPhone = (phone || guest.phone || '').trim();
    const token = guest.rsvp_token || generateRsvpToken(guest.id);
    guest.rsvp_token = token;
    if (recipientPhone) guest.phone = recipientPhone;

    const baseUrl = getPublicBaseUrl(req);
    const rsvpUrl = `${baseUrl.replace(/\/+$/, '')}/rsvp/${token}`;
    const pdfUrl = `${baseUrl.replace(/\/+$/, '')}/api/guests/${id}/invitation-pdf`;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'MarriageExpenseManagementBot';
    const botStartUrl = `https://t.me/${botUsername}?start=${token.startsWith('rsvp_') ? token : `rsvp_${token}`}`;

    const invitationText = customMessage && customMessage.trim()
      ? customMessage.trim()
      : generateTelegramInvitationText(guest, baseUrl);

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(rsvpUrl)}&text=${encodeURIComponent(invitationText)}`;
    const deepLink = `tg://msg_url?url=${encodeURIComponent(rsvpUrl)}&text=${encodeURIComponent(invitationText)}`;

    let botSent = false;
    if (guest.telegram_chat_id && process.env.TELEGRAM_BOT_TOKEN) {
      try {
        await sendTelegramReply(guest.telegram_chat_id, invitationText, { parse_mode: 'Markdown' });
        const pdfBuffer = await generateInvitationPDF(guest, baseUrl);
        await sendTelegramDocument(
          guest.telegram_chat_id,
          pdfBuffer,
          `Wedding_Invitation_${(guest.name || 'Guest').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          `📜 डिजिटल आमंत्रण पत्रिका - ${guest.name}`
        );
        botSent = true;
      } catch (botErr) {
        console.warn('Direct Telegram Bot message error:', botErr.message);
      }
    }

    const now = new Date().toISOString();
    if (isLibSQL()) {
      await dbRun(`
        UPDATE guests SET
          phone = ?,
          rsvp_token = ?,
          rsvp_status = 'Invited',
          invitation_sent_at = ?,
          invitation_channel = 'Telegram',
          updated_at = datetime('now')
        WHERE id = ?
      `, [recipientPhone, token, now, id]);
      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => g.id === id);
      if (idx !== -1) {
        if (recipientPhone) d.guests[idx].phone = recipientPhone;
        d.guests[idx].rsvp_token = token;
        d.guests[idx].rsvp_status = 'Invited';
        d.guests[idx].invitation_sent_at = now;
        d.guests[idx].invitation_channel = 'Telegram';
        d.guests[idx].updated_at = now;
        writeJSON(d);
        guest = formatGuest(d.guests[idx]);
      }
    }

    res.json({
      success: true,
      message: botSent
        ? `Telegram invitation successfully delivered directly to ${guest.name} via Telegram Bot!`
        : `Telegram invitation link ready for ${guest.name}${recipientPhone ? ` (${recipientPhone})` : ''}`,
      recipientPhone,
      invitationText,
      shareUrl,
      deepLink,
      botStartUrl,
      rsvpUrl,
      pdfUrl,
      botSent,
      guest
    });
  } catch (err) {
    console.error('Error in sendTelegramInvitation:', err);
    res.status(500).json({ error: err.message || 'Failed to send Telegram invitation' });
  }
}

async function sendBulkInvitations(req, res) {
  const { guestIds, customSubject, customMessage } = req.body || {};
  if (!Array.isArray(guestIds) || guestIds.length === 0) {
    return res.status(400).json({ error: 'No guests selected for invitation dispatch.' });
  }

  try {
    let allGuests = [];
    if (isLibSQL()) {
      const rows = await dbAll('SELECT * FROM guests WHERE user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = ""', [req.user.uid]);
      allGuests = rows.map(formatGuest);
    } else {
      const d = readJSON();
      allGuests = (d.guests || []).map(formatGuest);
    }

    const targetGuests = allGuests.filter(g => guestIds.includes(g.id));
    const baseUrl = getPublicBaseUrl(req);
    let sentCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const g of targetGuests) {
      if (!g.email || !g.email.trim()) {
        skippedCount++;
        continue;
      }
      try {
        const token = g.rsvp_token || generateRsvpToken(g.id);
        g.rsvp_token = token;
        await sendInvitationEmail({
          guest: g,
          customSubject,
          customMessage,
          baseUrl,
          userId: req.user.uid
        });

        const now = new Date().toISOString();
        if (isLibSQL()) {
          await dbRun(`
            UPDATE guests SET
              rsvp_token = ?,
              rsvp_status = 'Invited',
              invitation_sent_at = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `, [token, now, g.id]);
        } else {
          const d = readJSON();
          const idx = (d.guests || []).findIndex(item => item.id === g.id);
          if (idx !== -1) {
            d.guests[idx].rsvp_token = token;
            d.guests[idx].rsvp_status = 'Invited';
            d.guests[idx].invitation_sent_at = now;
            d.guests[idx].updated_at = now;
            writeJSON(d);
          }
        }
        sentCount++;
      } catch (err) {
        errors.push({ id: g.id, name: g.name, error: err.message });
      }
    }

    const emailConfig = await getUserEmailConfig(req.user.uid);

    res.json({
      success: true,
      sentCount,
      skippedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      isConfigured: Boolean(emailConfig),
      warning: !emailConfig
        ? 'Invitations generated in Sandbox mode because real email credentials are not yet configured. Guests did not receive real emails.'
        : null
    });
  } catch (err) {
    console.error('Error in bulk invitations:', err);
    res.status(500).json({ error: err.message || 'Bulk invitations failed' });
  }
}

async function getGuestById(req, res) {
  const id = parseInt(req.params.id);
  try {
    let guest;
    if (isLibSQL()) {
      const row = await dbGet('SELECT * FROM guests WHERE id = ? AND (user_id = ? OR user_id = "legacy_user" OR user_id IS NULL OR user_id = "")', [id, req.user.uid]);
      if (!row) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(row);
    } else {
      const d = readJSON();
      const item = (d.guests || []).find(g => Number(g.id) === Number(id));
      if (!item) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(item);
    }
    res.json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function downloadInvitationPdf(req, res) {
  const id = parseInt(req.params.id);
  try {
    let guest;
    if (isLibSQL()) {
      const row = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      if (!row) return res.status(404).send('Guest not found');
      guest = formatGuest(row);
    } else {
      const d = readJSON();
      const item = (d.guests || []).find(g => g.id === id);
      if (!item) return res.status(404).send('Guest not found');
      guest = formatGuest(item);
    }

    const baseUrl = getPublicBaseUrl(req);
    const pdfBuffer = await generateInvitationPDF(guest, baseUrl);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Wedding_Invitation_${guest.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).send('Error generating invitation PDF: ' + err.message);
  }
}

module.exports = {
  formatGuest,
  listGuests,
  getGuestById,
  getSummary,
  createGuest,
  updateGuest,
  deleteGuest,
  bulkOperations,
  importGuests,
  patchRsvpStatus,
  patchStayPreference,
  sendSingleInvitation,
  sendTelegramInvitation,
  sendBulkInvitations,
  downloadInvitationPdf
};
