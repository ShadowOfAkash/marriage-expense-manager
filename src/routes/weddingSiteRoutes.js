const express = require('express');
const { getApps } = require('../config/firebase');
const { requireAuth } = require('../middleware/auth');
const { isLibSQL, dbGet, dbRun, readJSON, writeJSON } = require('../db');
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
  const owner = process.env.WEDDING_SITE_ADMIN_EMAIL?.trim().toLowerCase();
  if (!owner || getApps().length === 0) {
    return res.status(503).json({ error: 'Configure Firebase Admin and WEDDING_SITE_ADMIN_EMAIL to edit the wedding website.' });
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
