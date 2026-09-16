const { isLibSQL, dbGet, dbAll, dbRun, readJSON, writeJSON } = require('../db');
const { DEFAULT_MARKETPLACE_VENDORS, VENDOR_CATEGORIES, HIRING_STAGES, INDIAN_CITIES } = require('../config/defaultVendors');

function normalizeBooking(b) {
  let deliverables = b.deliverables;
  if (typeof deliverables === 'string') {
    try {
      deliverables = JSON.parse(deliverables);
    } catch (_) {
      deliverables = deliverables ? [deliverables] : [];
    }
  }
  if (!Array.isArray(deliverables)) {
    deliverables = [];
  }

  return {
    ...b,
    id: Number(b.id),
    amount: Number(b.amount) || 0,
    advance: Number(b.advance) || 0,
    rating: Number(b.rating) || 4.8,
    is_favorite: Number(b.is_favorite) ? 1 : 0,
    hiring_stage: b.hiring_stage || 'Hired',
    contact_person: b.contact_person || '',
    phone: b.phone || '',
    email: b.email || '',
    city: b.city || '',
    deliverables,
    arrival_time: b.arrival_time || '',
    location_note: b.location_note || '',
    website_or_portfolio: b.website_or_portfolio || '',
    pros_cons: b.pros_cons || '',
    category: b.category || 'Miscellaneous',
    status: b.status || 'Pending',
    notes: b.notes || ''
  };
}

async function listBookings(req, res) {
  const userId = req.user?.uid || req.user?.id || 'legacy_user';
  const { stage, category, search, favorite } = req.query;

  try {
    let list = [];
    if (isLibSQL()) {
      const rows = await dbAll('SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC', [userId]);
      list = rows.map(normalizeBooking);
    } else {
      const d = readJSON();
      if (!d.bookings) d.bookings = [];
      list = d.bookings
        .filter(b => b.user_id === userId || !b.user_id || b.user_id === 'legacy_user')
        .map(normalizeBooking)
        .reverse();
    }

    if (stage) {
      list = list.filter(b => b.hiring_stage.toLowerCase() === stage.toLowerCase());
    }
    if (category) {
      list = list.filter(b => b.category.toLowerCase() === category.toLowerCase());
    }
    if (favorite === '1' || favorite === 'true') {
      list = list.filter(b => b.is_favorite === 1);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => 
        (b.vendor && b.vendor.toLowerCase().includes(q)) ||
        (b.service && b.service.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.contact_person && b.contact_person.toLowerCase().includes(q))
      );
    }

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getVendorSummary(req, res) {
  const userId = req.user?.uid || req.user?.id || 'legacy_user';
  try {
    let list = [];
    let payments = [];

    if (isLibSQL()) {
      const rows = await dbAll('SELECT * FROM bookings WHERE user_id = ?', [userId]);
      list = rows.map(normalizeBooking);
      payments = await dbAll('SELECT * FROM payments WHERE user_id = ?', [userId]);
    } else {
      const d = readJSON();
      list = (d.bookings || [])
        .filter(b => b.user_id === userId || !b.user_id || b.user_id === 'legacy_user')
        .map(normalizeBooking);
      payments = (d.payments || []).filter(p => p.user_id === userId || !p.user_id || p.user_id === 'legacy_user');
    }

    const byStage = {
      Shortlisted: 0,
      Inquired: 0,
      Evaluating: 0,
      Hired: 0,
      Declined: 0
    };

    let totalBookedValue = 0;
    let totalPaid = 0;

    for (const b of list) {
      const st = b.hiring_stage || 'Hired';
      if (byStage[st] !== undefined) {
        byStage[st]++;
      } else {
        byStage.Hired++;
      }

      if (st === 'Hired') {
        const amt = Number(b.amount) || 0;
        totalBookedValue += amt;

        const linked = payments.filter(p => String(p.booking_id) === String(b.id));
        const paidViaExpenses = linked.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const effectivePaid = paidViaExpenses > 0 ? paidViaExpenses : (Number(b.advance) || 0);
        totalPaid += effectivePaid;
      }
    }

    const totalRemaining = Math.max(0, totalBookedValue - totalPaid);

    res.json({
      total: list.length,
      byStage,
      totalBookedValue,
      totalPaid,
      totalRemaining
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createBooking(req, res) {
  const userId = req.user?.uid || req.user?.id || 'legacy_user';
  const {
    vendor, service, category, booking_date, event_date, amount, advance, status, notes,
    hiring_stage, contact_person, phone, email, city, rating, deliverables,
    arrival_time, location_note, is_favorite, website_or_portfolio, pros_cons
  } = req.body;

  if (!vendor || !service) return res.status(400).json({ error: 'Vendor and service required' });

  const finalCategory = category || 'Miscellaneous';
  const finalStage = hiring_stage || 'Hired';
  const finalDeliverables = Array.isArray(deliverables) ? JSON.stringify(deliverables) : (deliverables || '[]');
  const now = new Date().toISOString();

  try {
    if (isLibSQL()) {
      const result = await dbRun(`
        INSERT INTO bookings (
          user_id, vendor, service, category, booking_date, event_date,
          amount, advance, status, notes, hiring_stage, contact_person,
          phone, email, city, rating, deliverables, arrival_time,
          location_note, is_favorite, website_or_portfolio, pros_cons, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        userId, vendor, service, finalCategory, booking_date || '', event_date || '',
        Number(amount) || 0, Number(advance) || 0, status || 'Pending', notes || '',
        finalStage, contact_person || '', phone || '', email || '', city || '',
        Number(rating) || 4.8, finalDeliverables, arrival_time || '',
        location_note || '', is_favorite ? 1 : 0, website_or_portfolio || '', pros_cons || ''
      ]);

      const row = await dbGet('SELECT * FROM bookings WHERE id = ?', [Number(result.lastInsertRowid)]);
      return res.status(201).json(normalizeBooking(row));
    }

    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const newBooking = {
      id: Date.now(),
      user_id: userId,
      vendor,
      service,
      category: finalCategory,
      booking_date: booking_date || '',
      event_date: event_date || '',
      amount: Number(amount) || 0,
      advance: Number(advance) || 0,
      status: status || 'Pending',
      notes: notes || '',
      hiring_stage: finalStage,
      contact_person: contact_person || '',
      phone: phone || '',
      email: email || '',
      city: city || '',
      rating: Number(rating) || 4.8,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      arrival_time: arrival_time || '',
      location_note: location_note || '',
      is_favorite: is_favorite ? 1 : 0,
      website_or_portfolio: website_or_portfolio || '',
      pros_cons: pros_cons || '',
      created_at: now
    };
    d.bookings.push(newBooking);
    writeJSON(d);
    res.status(201).json(normalizeBooking(newBooking));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updateBooking(req, res) {
  const userId = req.user?.uid || req.user?.id || 'legacy_user';
  const id = parseInt(req.params.id);
  const {
    vendor, service, category, booking_date, event_date, amount, advance, status, notes,
    hiring_stage, contact_person, phone, email, city, rating, deliverables,
    arrival_time, location_note, is_favorite, website_or_portfolio, pros_cons
  } = req.body;

  const finalDeliverables = Array.isArray(deliverables) ? JSON.stringify(deliverables) : deliverables;

  try {
    if (isLibSQL()) {
      await dbRun(`
        UPDATE bookings SET
          vendor = COALESCE(?, vendor),
          service = COALESCE(?, service),
          category = COALESCE(?, category),
          booking_date = COALESCE(?, booking_date),
          event_date = COALESCE(?, event_date),
          amount = COALESCE(?, amount),
          advance = COALESCE(?, advance),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          hiring_stage = COALESCE(?, hiring_stage),
          contact_person = COALESCE(?, contact_person),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          city = COALESCE(?, city),
          rating = COALESCE(?, rating),
          deliverables = COALESCE(?, deliverables),
          arrival_time = COALESCE(?, arrival_time),
          location_note = COALESCE(?, location_note),
          is_favorite = COALESCE(?, is_favorite),
          website_or_portfolio = COALESCE(?, website_or_portfolio),
          pros_cons = COALESCE(?, pros_cons)
        WHERE id = ? AND (user_id = ? OR user_id = 'legacy_user')
      `, [
        vendor, service, category, booking_date, event_date,
        amount !== undefined ? Number(amount) : null,
        advance !== undefined ? Number(advance) : null,
        status, notes, hiring_stage, contact_person, phone, email, city,
        rating !== undefined ? Number(rating) : null,
        finalDeliverables !== undefined ? finalDeliverables : null,
        arrival_time, location_note,
        is_favorite !== undefined ? (is_favorite ? 1 : 0) : null,
        website_or_portfolio, pros_cons,
        id, userId
      ]);

      const row = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.json(normalizeBooking(row));
    }

    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const curr = d.bookings[idx];
    d.bookings[idx] = {
      ...curr,
      vendor: vendor !== undefined ? vendor : curr.vendor,
      service: service !== undefined ? service : curr.service,
      category: category !== undefined ? category : curr.category,
      booking_date: booking_date !== undefined ? booking_date : curr.booking_date,
      event_date: event_date !== undefined ? event_date : curr.event_date,
      amount: amount !== undefined ? Number(amount) : curr.amount,
      advance: advance !== undefined ? Number(advance) : curr.advance,
      status: status !== undefined ? status : curr.status,
      notes: notes !== undefined ? notes : curr.notes,
      hiring_stage: hiring_stage !== undefined ? hiring_stage : (curr.hiring_stage || 'Hired'),
      contact_person: contact_person !== undefined ? contact_person : curr.contact_person,
      phone: phone !== undefined ? phone : curr.phone,
      email: email !== undefined ? email : curr.email,
      city: city !== undefined ? city : curr.city,
      rating: rating !== undefined ? Number(rating) : curr.rating,
      deliverables: deliverables !== undefined ? deliverables : curr.deliverables,
      arrival_time: arrival_time !== undefined ? arrival_time : curr.arrival_time,
      location_note: location_note !== undefined ? location_note : curr.location_note,
      is_favorite: is_favorite !== undefined ? (is_favorite ? 1 : 0) : curr.is_favorite,
      website_or_portfolio: website_or_portfolio !== undefined ? website_or_portfolio : curr.website_or_portfolio,
      pros_cons: pros_cons !== undefined ? pros_cons : curr.pros_cons
    };
    writeJSON(d);
    res.json(normalizeBooking(d.bookings[idx]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updateHiringStage(req, res) {
  const userId = req.user?.uid || req.user?.id || 'legacy_user';
  const id = parseInt(req.params.id);
  const { stage } = req.body;

  if (!stage) return res.status(400).json({ error: 'Stage is required' });

  try {
    if (isLibSQL()) {
      await dbRun('UPDATE bookings SET hiring_stage = ? WHERE id = ? AND (user_id = ? OR user_id = "legacy_user")', [stage, id, userId]);
      const row = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.json(normalizeBooking(row));
    }

    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    d.bookings[idx].hiring_stage = stage;
    writeJSON(d);
    res.json(normalizeBooking(d.bookings[idx]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function toggleFavorite(req, res) {
  const userId = req.user?.uid || req.user?.id || 'legacy_user';
  const id = parseInt(req.params.id);

  try {
    if (isLibSQL()) {
      const row = await dbGet('SELECT is_favorite FROM bookings WHERE id = ?', [id]);
      if (!row) return res.status(404).json({ error: 'Not found' });
      const nextFav = row.is_favorite ? 0 : 1;
      await dbRun('UPDATE bookings SET is_favorite = ? WHERE id = ? AND (user_id = ? OR user_id = "legacy_user")', [nextFav, id, userId]);
      const updated = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
      return res.json(normalizeBooking(updated));
    }

    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    d.bookings[idx].is_favorite = d.bookings[idx].is_favorite ? 0 : 1;
    writeJSON(d);
    res.json(normalizeBooking(d.bookings[idx]));
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

async function getCallSheet(req, res) {
  const userId = req.user?.uid || req.user?.id || 'legacy_user';
  try {
    let list = [];
    let payments = [];

    if (isLibSQL()) {
      const rows = await dbAll("SELECT * FROM bookings WHERE user_id = ? AND hiring_stage = 'Hired' ORDER BY arrival_time ASC, id ASC", [userId]);
      list = rows.map(normalizeBooking);
      payments = await dbAll('SELECT * FROM payments WHERE user_id = ?', [userId]);
    } else {
      const d = readJSON();
      list = (d.bookings || [])
        .filter(b => (b.user_id === userId || !b.user_id || b.user_id === 'legacy_user') && (b.hiring_stage === 'Hired' || !b.hiring_stage))
        .map(normalizeBooking);
      payments = (d.payments || []).filter(p => p.user_id === userId || !p.user_id || p.user_id === 'legacy_user');
    }

    const callSheet = list.map(b => {
      const amt = Number(b.amount) || 0;
      const linked = payments.filter(p => String(p.booking_id) === String(b.id));
      const paidViaExpenses = linked.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalPaid = paidViaExpenses > 0 ? paidViaExpenses : (Number(b.advance) || 0);
      const balanceDue = Math.max(0, amt - totalPaid);

      return {
        id: b.id,
        vendor: b.vendor,
        service: b.service,
        category: b.category,
        contact_person: b.contact_person || 'Lead Coordinator',
        phone: b.phone || 'N/A',
        email: b.email || '',
        arrival_time: b.arrival_time || 'Schedule Pending',
        location_note: b.location_note || 'Main Venue',
        event_date: b.event_date || '',
        total_amount: amt,
        paid_amount: totalPaid,
        balance_due: balanceDue,
        deliverables: b.deliverables
      };
    });

    res.json(callSheet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getMarketplaceDirectory(req, res) {
  const { category, city, search } = req.query;

  try {
    let result = [...DEFAULT_MARKETPLACE_VENDORS];

    if (category && category !== 'All') {
      result = result.filter(v => v.category.toLowerCase() === category.toLowerCase());
    }
    if (city && city !== 'All Cities') {
      result = result.filter(v => v.city.toLowerCase() === city.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v =>
        v.vendor.toLowerCase().includes(q) ||
        v.service.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q))
      );
    }

    res.json({
      categories: VENDOR_CATEGORIES,
      cities: INDIAN_CITIES,
      hiring_stages: HIRING_STAGES,
      vendors: result
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function shortlistMarketplaceVendor(req, res) {
  const userId = req.user?.uid || req.user?.id || 'legacy_user';
  const { vendorId, customQuote } = req.body;

  const found = DEFAULT_MARKETPLACE_VENDORS.find(v => v.id === vendorId);
  if (!found) {
    return res.status(404).json({ error: 'Marketplace vendor not found' });
  }

  const payload = {
    vendor: found.vendor,
    service: found.service,
    category: found.category,
    amount: customQuote || found.typical_quote || 0,
    advance: 0,
    status: 'Pending',
    hiring_stage: 'Shortlisted',
    contact_person: found.contact_person,
    phone: found.phone,
    email: found.email,
    city: found.city,
    rating: found.rating,
    deliverables: found.deliverables,
    website_or_portfolio: found.website_or_portfolio,
    pros_cons: `Pros: ${found.pros} | Cons: ${found.cons}`,
    notes: `Shortlisted from Marketplace. ${found.description}`
  };

  req.body = payload;
  return createBooking(req, res);
}

module.exports = {
  listBookings,
  getVendorSummary,
  createBooking,
  updateBooking,
  updateHiringStage,
  toggleFavorite,
  deleteBooking,
  getCallSheet,
  getMarketplaceDirectory,
  shortlistMarketplaceVendor
};
