const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const regexReplace = (pattern, replacement) => {
  code = code.replace(pattern, replacement);
};

// 1. GET /api/savings
code = code.replace(
  "const rows = await dbAll('SELECT * FROM savings ORDER BY year DESC, id DESC');",
  "const rows = await dbAll('SELECT * FROM savings WHERE user_id = ? ORDER BY year DESC, id DESC', [req.user.uid]);"
);
code = code.replace(
  "res.json([...d.savings].sort((a, b) => {",
  "res.json([...d.savings].filter(s => s.user_id === req.user.uid).sort((a, b) => {"
);

// 2. POST /api/savings
code = code.replace(
  "'INSERT INTO savings (month, year, amount, note) VALUES (?, ?, ?, ?)',\n        [month, Number(year), Number(amount), note]",
  "'INSERT INTO savings (month, year, amount, note, user_id) VALUES (?, ?, ?, ?, ?)',\n        [month, Number(year), Number(amount), note, req.user.uid]"
);

code = code.replace(
  "d.savings.push({ id: d._nextSavingId++, month, year: Number(year), amount: Number(amount), note, created_at: new Date().toISOString() });",
  "d.savings.push({ id: d._nextSavingId++, user_id: req.user.uid, month, year: Number(year), amount: Number(amount), note, created_at: new Date().toISOString() });"
);


// 3. DELETE /api/savings/:id
code = code.replace(
  "await dbRun('DELETE FROM savings WHERE id=?', [req.params.id]);",
  "await dbRun('DELETE FROM savings WHERE id=? AND user_id=?', [req.params.id, req.user.uid]);"
);
code = code.replace(
  "const idx = d.savings.findIndex(s => s.id === Number(req.params.id));",
  "const idx = d.savings.findIndex(s => s.id === Number(req.params.id) && s.user_id === req.user.uid);"
);

// 4. POST /api/expenses
code = code.replace(
  "'INSERT INTO expenses (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',\n        [category, description || '', Number(amount), date, finalStatus, receipt_url || '']",
  "'INSERT INTO expenses (category, description, amount, date, status, receipt_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',\n        [category, description || '', Number(amount), date, finalStatus, receipt_url || '', req.user.uid]"
);
code = code.replace(
  "d.expenses.push({ id: d._nextExpenseId++, category, description: description || '', amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || '', created_at: new Date().toISOString() });",
  "d.expenses.push({ id: d._nextExpenseId++, user_id: req.user.uid, category, description: description || '', amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || '', created_at: new Date().toISOString() });"
);

// 5. PUT /api/expenses/:id
code = code.replace(
  "'UPDATE expenses SET category=?, description=?, amount=?, date=?, status=?, receipt_url=? WHERE id=?',\n        [category, description || '', Number(amount), date, finalStatus, receipt_url || '', req.params.id]",
  "'UPDATE expenses SET category=?, description=?, amount=?, date=?, status=?, receipt_url=? WHERE id=? AND user_id=?',\n        [category, description || '', Number(amount), date, finalStatus, receipt_url || '', req.params.id, req.user.uid]"
);
code = code.replace(
  "const idx = d.expenses.findIndex(e => e.id === Number(req.params.id));",
  "const idx = d.expenses.findIndex(e => e.id === Number(req.params.id) && e.user_id === req.user.uid);"
);

// 6. DELETE /api/expenses/:id
code = code.replace(
  "await dbRun('DELETE FROM expenses WHERE id=?', [req.params.id]);",
  "await dbRun('DELETE FROM expenses WHERE id=? AND user_id=?', [req.params.id, req.user.uid]);"
);
// JSON delete for expenses was already patched with a regex earlier? Wait, no I used replace before which might have failed. Let's force it.
code = code.replace(
  "const idx = d.expenses.findIndex(e => e.id === Number(req.params.id));", // If there's another one
  "const idx = d.expenses.findIndex(e => e.id === Number(req.params.id) && e.user_id === req.user.uid);"
);

fs.writeFileSync('server.js', code);
console.log('Fixed ALL routes to inject user_id correctly!');
