const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Database schema updates
code = code.replace(
  "try { await db.execute(\"ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'approved'\"); } catch(e){}",
  `try { await db.execute("ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'approved'"); } catch(e){}
    try { await db.execute("ALTER TABLE expenses ADD COLUMN receipt_url TEXT DEFAULT ''"); } catch(e){}`
);

// 2. /api/expenses/scan -> Save image to uploads
code = code.replace(
  "const { image, mimeType } = req.body;",
  `const { image, mimeType } = req.body;
    const imgBuffer = Buffer.from(image, 'base64');
    const filename = \`scan_\${Date.now()}.jpg\`;
    const fs = require('fs');
    fs.writeFileSync(require('path').join(__dirname, 'public/uploads', filename), imgBuffer);
    const receipt_url = \`/uploads/\${filename}\`;`
);
code = code.replace(
  "res.json(parsedData);",
  "res.json({ ...parsedData, receipt_url });"
);

// 3. POST /api/expenses -> accept receipt_url
code = code.replace(
  "const { category, description, amount, date, status } = req.body;",
  "const { category, description, amount, date, status, receipt_url } = req.body;"
).replace(
  "'INSERT INTO expenses (category, description, amount, date, status) VALUES (?, ?, ?, ?, ?)',\n        [category, description || '', Number(amount), date, finalStatus]",
  "'INSERT INTO expenses (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',\n        [category, description || '', Number(amount), date, finalStatus, receipt_url || '']"
).replace(
  "const expense = { id: d._nextExpenseId++, category, description: description || '', amount: Number(amount), date, status: finalStatus, created_at: new Date().toISOString() };",
  "const expense = { id: d._nextExpenseId++, category, description: description || '', amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || '', created_at: new Date().toISOString() };"
);

// 4. PUT /api/expenses/:id -> accept receipt_url
code = code.replace(
  "const { category, description, amount, date, status } = req.body;",
  "const { category, description, amount, date, status, receipt_url } = req.body;"
).replace(
  "'UPDATE expenses SET category=?,description=?,amount=?,date=?,status=? WHERE id=?',\n        [category, description || '', Number(amount), date, finalStatus, id]",
  "'UPDATE expenses SET category=?,description=?,amount=?,date=?,status=?,receipt_url=? WHERE id=?',\n        [category, description || '', Number(amount), date, finalStatus, receipt_url || '', id]"
).replace(
  "d.expenses[idx] = { ...d.expenses[idx], category, description: description || '', amount: Number(amount), date, status: finalStatus };",
  "d.expenses[idx] = { ...d.expenses[idx], category, description: description || '', amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || d.expenses[idx].receipt_url || '' };"
);

// 5. Telegram Webhook -> save image and receipt_url
code = code.replace(
  "const base64Image = Buffer.from(arrayBuffer).toString('base64');",
  `const imgBuffer = Buffer.from(arrayBuffer);
    const base64Image = imgBuffer.toString('base64');
    const filename = \`tg_\${Date.now()}.jpg\`;
    const fs = require('fs');
    fs.writeFileSync(require('path').join(__dirname, 'public/uploads', filename), imgBuffer);
    const receipt_url = \`/uploads/\${filename}\`;`
).replace(
  "'INSERT INTO expenses (category, description, amount, date, status) VALUES (?, ?, ?, ?, ?)',\n        [finalCat, finalDesc, finalAmount, finalDate, 'draft']",
  "'INSERT INTO expenses (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',\n        [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url]"
).replace(
  "d.expenses.push({ id: d._nextExpenseId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', created_at: new Date().toISOString() });",
  "d.expenses.push({ id: d._nextExpenseId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', receipt_url, created_at: new Date().toISOString() });"
);

fs.writeFileSync('server.js', code);
console.log("server.js patched for receipt URLs.");
