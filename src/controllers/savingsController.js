const { MONTH_ORDER } = require('../config/env');
const { isLibSQL, dbGet, dbAll, dbRun, readJSON, writeJSON } = require('../db');

async function listSavings(req, res) {
  try {
    if (isLibSQL()) {
      const rows = await dbAll('SELECT * FROM savings WHERE user_id = ? ORDER BY year DESC, id DESC', [req.user.uid]);
      return res.json(rows);
    }
    const d = readJSON();
    res.json([...d.savings].filter(s => s.user_id === req.user.uid || !s.user_id || s.user_id === 'legacy_user').sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return MONTH_ORDER.indexOf(b.month) - MONTH_ORDER.indexOf(a.month);
    }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createSaving(req, res) {
  const { month, year, amount, note } = req.body;
  if (!month || !year || !amount) {
    return res.status(400).json({ error: 'Month, year and amount required' });
  }

  try {
    if (isLibSQL()) {
      const r = await dbRun(
        'INSERT INTO savings (month, year, amount, note, user_id) VALUES (?, ?, ?, ?, ?)',
        [month, parseInt(year), Number(amount), note || '', req.user.uid]
      );
      const row = await dbGet('SELECT * FROM savings WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }

    const d = readJSON();
    const saving = {
      id: d._nextSavingsId++,
      user_id: req.user.uid,
      month,
      year: parseInt(year),
      amount: Number(amount),
      note: note || '',
      created_at: new Date().toISOString()
    };
    d.savings.push(saving);
    writeJSON(d);
    res.status(201).json(saving);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function deleteSaving(req, res) {
  const id = parseInt(req.params.id);
  try {
    if (isLibSQL()) {
      await dbRun('DELETE FROM savings WHERE id = ?', [id]);
      return res.json({ success: true });
    }
    const d = readJSON();
    const idx = d.savings.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.savings.splice(idx, 1);
    writeJSON(d);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  listSavings,
  createSaving,
  deleteSaving
};
