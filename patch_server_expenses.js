const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Ensure booking_id exists in SQLite Schema
if (!code.includes('ALTER TABLE expenses ADD COLUMN booking_id')) {
  const initDbHook = `
    try { await dbRun("ALTER TABLE expenses ADD COLUMN booking_id INTEGER"); } catch(e) {}
  `;
  code = code.replace(/await dbRun\(\`CREATE TABLE IF NOT EXISTS expenses \([\s\S]*?\)\`\);/, 
    `await dbRun(\`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, category TEXT, description TEXT, amount REAL, date TEXT, status TEXT, receipt_url TEXT
    )\`);
    ${initDbHook}`
  );
}

// Update POST
code = code.replace(
  /const \{ category, description, amount, date, status, receipt_url \} = req\.body;/,
  "const { category, description, amount, date, status, receipt_url, booking_id } = req.body;"
);

code = code.replace(
  /'INSERT INTO expenses \(user_id, category, description, amount, date, status, receipt_url\) VALUES \(\?, \?, \?, \?, \?, \?, \?\)',\s*\[req\.user\.uid, category, description, Number\(amount\), date, finalStatus, receipt_url \|\| ''\]/,
  `'INSERT INTO expenses (user_id, category, description, amount, date, status, receipt_url, booking_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.uid, category, description, Number(amount), date, finalStatus, receipt_url || '', booking_id || null]`
);

code = code.replace(
  /const newExpense = \{ id: Date\.now\(\), user_id: req\.user\.uid, category, description, amount: Number\(amount\), date, status: finalStatus, receipt_url: receipt_url \|\| '' \};/,
  "const newExpense = { id: Date.now(), user_id: req.user.uid, category, description, amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || '', booking_id: booking_id || null };"
);

// Update PUT
code = code.replace(
  /const \{ category, description, amount, date, status, receipt_url \} = req\.body;(\s*try \{)/g,
  "const { category, description, amount, date, status, receipt_url, booking_id } = req.body;$1"
);

code = code.replace(
  /'UPDATE expenses SET category=\?, description=\?, amount=\?, date=\?, status=\?, receipt_url=\? WHERE id=\? AND user_id=\?',\s*\[category, description, Number\(amount\), date, status, receipt_url, id, req\.user\.uid\]/,
  `'UPDATE expenses SET category=?, description=?, amount=?, date=?, status=?, receipt_url=?, booking_id=? WHERE id=? AND user_id=?',
        [category, description, Number(amount), date, status, receipt_url, booking_id || null, id, req.user.uid]`
);

code = code.replace(
  /d\.expenses\[idx\] = \{ \.\.\.d\.expenses\[idx\], category, description, amount: Number\(amount\), date, status, receipt_url \};/,
  "d.expenses[idx] = { ...d.expenses[idx], category, description, amount: Number(amount), date, status, receipt_url, booking_id: booking_id || null };"
);

fs.writeFileSync('server.js', code);
console.log("Patched server.js for booking_id in expenses");
