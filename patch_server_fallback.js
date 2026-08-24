const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Filter JSON fallback reads by user_id
code = code.replace(
  "res.json([...readJSON().expenses].sort((a, b) => b.date.localeCompare(a.date)));",
  "res.json([...readJSON().expenses].filter(e => e.user_id === req.user.uid).sort((a, b) => b.date.localeCompare(a.date)));"
);

code = code.replace(
  "res.json([...readJSON().savings].sort((a, b) => b.year - a.year || b.month.localeCompare(a.month)));",
  "res.json([...readJSON().savings].filter(s => s.user_id === req.user.uid).sort((a, b) => b.year - a.year || b.month.localeCompare(a.month)));"
);

// Update JSON writes to include user_id
code = code.replace(
  "d.expenses.push({ id: d._nextExpenseId++, category, description, amount: Number(amount), date, created_at: new Date().toISOString() });",
  "d.expenses.push({ id: d._nextExpenseId++, user_id: req.user.uid, category, description, amount: Number(amount), date, created_at: new Date().toISOString() });"
);

code = code.replace(
  "const idx = d.expenses.findIndex(e => e.id === Number(req.params.id));",
  "const idx = d.expenses.findIndex(e => e.id === Number(req.params.id) && e.user_id === req.user.uid);"
);

code = code.replace(
  "d.savings.push({ id: d._nextSavingId++, month, year: Number(year), amount: Number(amount), note, created_at: new Date().toISOString() });",
  "d.savings.push({ id: d._nextSavingId++, user_id: req.user.uid, month, year: Number(year), amount: Number(amount), note, created_at: new Date().toISOString() });"
);

code = code.replace(
  "const idx = d.savings.findIndex(s => s.id === Number(req.params.id));",
  "const idx = d.savings.findIndex(s => s.id === Number(req.params.id) && s.user_id === req.user.uid);"
);

// Budget JSON logic
code = code.replace(
  "res.json(readJSON().budget || { amount: 0 });",
  "const d = readJSON();\n    res.json(d.user_budgets?.[req.user.uid] || { amount: 0 });"
);

code = code.replace(
  "const d = readJSON();\n    d.budget = { amount: Number(amount), updated_at: new Date().toISOString() };\n    writeJSON(d);\n    res.json(d.budget);",
  "const d = readJSON();\n    if(!d.user_budgets) d.user_budgets = {};\n    d.user_budgets[req.user.uid] = { amount: Number(amount), updated_at: new Date().toISOString() };\n    writeJSON(d);\n    res.json(d.user_budgets[req.user.uid]);"
);

fs.writeFileSync('server.js', code);
console.log('JSON fallback routes patched');
