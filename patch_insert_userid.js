const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Fix POST /api/expenses JSON missing user_id
const oldExpenseJson = "const expense = { id: d._nextExpenseId++, category, description: description || '', amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || '', created_at: new Date().toISOString() };";
const newExpenseJson = "const expense = { id: d._nextExpenseId++, user_id: req.user.uid, category, description: description || '', amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || '', created_at: new Date().toISOString() };";
code = code.replace(oldExpenseJson, newExpenseJson);

// Fix POST /api/savings SQL and JSON missing user_id
const oldSavingsPost = `app.post('/api/savings', requireAuth, async (req, res) => {
  const { month, year, amount, note } = req.body;
  if (!month || !year || !amount) return res.status(400).json({ error: 'Month, year and amount required' });
  try {
    if (useLibSQL) {
      const r = await dbRun(
        'INSERT INTO savings (month, year, amount, note) VALUES (?, ?, ?, ?)',
        [month, parseInt(year), Number(amount), note || '']
      );
      const row = await dbGet('SELECT * FROM savings WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }
    const d = readJSON();
    const saving = { id: d._nextSavingsId++, month, year: parseInt(year), amount: Number(amount), note: note || '', created_at: new Date().toISOString() };
    d.savings.push(saving); writeJSON(d); res.status(201).json(saving);
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

const newSavingsPost = `app.post('/api/savings', requireAuth, async (req, res) => {
  const { month, year, amount, note } = req.body;
  if (!month || !year || !amount) return res.status(400).json({ error: 'Month, year and amount required' });
  try {
    if (useLibSQL) {
      const r = await dbRun(
        'INSERT INTO savings (month, year, amount, note, user_id) VALUES (?, ?, ?, ?, ?)',
        [month, parseInt(year), Number(amount), note || '', req.user.uid]
      );
      const row = await dbGet('SELECT * FROM savings WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }
    const d = readJSON();
    const saving = { id: d._nextSavingsId++, user_id: req.user.uid, month, year: parseInt(year), amount: Number(amount), note: note || '', created_at: new Date().toISOString() };
    d.savings.push(saving); writeJSON(d); res.status(201).json(saving);
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

code = code.replace(oldSavingsPost, newSavingsPost);
fs.writeFileSync('server.js', code);
console.log('Fixed missing user_id on backend inserts!');
