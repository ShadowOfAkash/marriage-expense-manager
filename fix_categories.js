const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const oldCats = `app.get('/api/expenses/categories', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      return res.json(await dbAll(
        'SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses GROUP BY category ORDER BY total DESC'
      ));
    }
    const d = readJSON(); const map = {};
    for (const e of d.expenses) {
      if (!map[e.category]) map[e.category] = { category: e.category, total: 0, count: 0 };
      map[e.category].total += e.amount; map[e.category].count++;
    }
    res.json(Object.values(map).sort((a, b) => b.total - a.total));
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

const newCats = `app.get('/api/expenses/categories', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      return res.json(await dbAll(
        'SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC',
        [req.user.uid]
      ));
    }
    const d = readJSON(); const map = {};
    for (const e of d.expenses.filter(e => e.user_id === req.user.uid)) {
      if (!map[e.category]) map[e.category] = { category: e.category, total: 0, count: 0 };
      map[e.category].total += e.amount; map[e.category].count++;
    }
    res.json(Object.values(map).sort((a, b) => b.total - a.total));
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

code = code.replace(oldCats, newCats);
fs.writeFileSync('server.js', code);
console.log('Fixed /api/expenses/categories for multi-tenant auth');
