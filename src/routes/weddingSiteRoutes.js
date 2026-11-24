const express = require('express');
const { getApps } = require('../config/firebase');
const { requireAuth } = require('../middleware/auth');
const { isLibSQL, dbGet, dbRun, readJSON, writeJSON } = require('../db');
const { getWebsiteGuestOwnerEmail, getWebsiteGuestOwner, saveWebsiteGuest } = require('../services/websiteGuestService');
const groups = require('../config/wedding-fields.json');

const router = express.Router();
const fields = Object.assign({}, ...Object.values(groups));
const defaults = Object.fromEntries(
  Object.entries(fields).map(([key, field]) => [key, field.default])
);

function validValue(key, value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 1000) return false;
  if (!key.endsWith('At')) return true;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(value + ':00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value;
}

function requireSiteOwner(req, res, next) {
  const owner = getWebsiteGuestOwnerEmail();
  if (getApps().length === 0) {
    return res.status(503).json({ error: 'Configure Firebase Admin to edit the wedding website.' });
  }
  return requireAuth(req, res, () => {
    if (!req.user.email_verified || req.user.email?.toLowerCase() !== owner) {
      return res.status(403).json({ error: 'Only the verified wedding website owner can edit this content.' });
    }
    return next();
  });
}

async function getContent() {
  let stored;
  if (isLibSQL()) {
    const row = await dbGet('SELECT content FROM wedding_site WHERE id = 1');
    stored = row ? JSON.parse(row.content) : {};
  } else {
    stored = readJSON().weddingSite || {};
  }
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) =>
    [key, validValue(key, stored[key]) ? stored[key] : fallback]
  ));
}

router.get('/public/wedding-site', async (_req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store').json({ content: await getContent() });
  } catch (error) {
    next(error);
  }
});

const eventKeys = ['haldi', 'mehndi', 'wedding'];

router.post('/public/wedding-site/rsvps', async (req, res, next) => {
  const { id, name, attendance, events, guests, adults = guests, children = 0,
    side = 'Both', relationship = 'Other', phone = '', email = '',
    food = '', stay = '', requirements = '' } = req.body || {};
  const attending = attendance === 'yes';
  const validText = (value, limit) => typeof value === 'string' && value.length <= limit;
  if (!validText(phone, 30) || !/^\+?[0-9]{7,15}$/.test(phone.trim().replace(/[ ()-]/g, ''))) {
    return res.status(400).json({ error: 'Enter a valid mobile number.' });
  }
  if (!['Groom', 'Bride', 'Both'].includes(side) ||
      !['Family', 'Friend', 'Colleague', 'Other'].includes(relationship) ||
      !validText(email, 254) ||
      (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) ||
      (attending && (!['', 'Vegetarian', 'Non-Veg', 'Jain', 'Vegan', 'Other'].includes(food) ||
        !['', 'No need of stay', 'Hotel', 'Home Stay'].includes(stay) ||
        !validText(requirements, 500) || !Number.isInteger(adults) || adults < 1 ||
        !Number.isInteger(children) || children < 0 || adults + children !== guests))) {
    return res.status(400).json({ error: 'Check your contact details and guest preferences.' });
  }
  if (typeof id !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id) ||
      typeof name !== 'string' || !name.trim() || name.length > 120 ||
      !['yes', 'no'].includes(attendance) ||
      (attendance === 'yes' && (!Array.isArray(events) || events.length < 1 ||
        events.length > eventKeys.length || !events.every(event => eventKeys.includes(event)) ||
        !Number.isInteger(guests) || guests < 1 || guests > 50))) {
    return res.status(400).json({ error: 'Enter your name and check your RSVP details.' });
  }

  const response = {
    id,
    name: name.trim(),
    attendance,
    events: attendance === 'yes' ? [...new Set(events)] : [],
    guests: attendance === 'yes' ? guests : 0,
    adults: attending ? adults : 0,
    children: attending ? children : 0,
    side, relationship, phone: phone.trim(), email: email.trim(),
    food: attending ? food : '',
    stay: attending && stay ? stay : 'No need of stay',
    requirements: attending ? requirements.trim() : '',
    receivedAt: new Date().toISOString(),
  };

  try {
    const owner = getWebsiteGuestOwner();
    if (!owner) return res.status(503).json({ error: 'Online RSVP is unavailable.' });
    await saveWebsiteGuest(response, owner);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/wedding-site', requireSiteOwner, async (_req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store').json({ groups, content: await getContent() });
  } catch (error) {
    next(error);
  }
});

router.put('/wedding-site', requireSiteOwner, async (req, res, next) => {
  try {
    const submitted = req.body?.content;
    if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
      return res.status(400).json({ error: 'Submit the wedding website content.' });
    }
    for (const [key, field] of Object.entries(fields)) {
      if (!validValue(key, submitted[key])) {
        return res.status(400).json({ error: `Enter a valid value for ${field.label}.` });
      }
    }
    const content = Object.fromEntries(Object.keys(fields).map(key => [key, submitted[key].trim()]));
    if (isLibSQL()) {
      await dbRun(
        'INSERT INTO wedding_site (id, content) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content',
        [JSON.stringify(content)]
      );
    } else {
      const data = readJSON();
      data.weddingSite = content;
      writeJSON(data);
    }
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
