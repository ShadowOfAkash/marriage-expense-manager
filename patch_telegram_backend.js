const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Add Tables
const oldTables = `CREATE TABLE IF NOT EXISTS user_budget`;
const newTables = `CREATE TABLE IF NOT EXISTS telegram_links (
        chat_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS telegram_codes (
        code TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS user_budget`;
code = code.replace(oldTables, newTables);

// 2. Add API Route for Link Code
const linkRoute = `
app.post('/api/telegram/link-code', requireAuth, async (req, res) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  try {
    if (useLibSQL) {
      await dbRun('DELETE FROM telegram_codes WHERE user_id = ?', [req.user.uid]); // clear old
      await dbRun('INSERT INTO telegram_codes (code, user_id) VALUES (?, ?)', [code, req.user.uid]);
    } else {
      const d = readJSON();
      if (!d.telegram_codes) d.telegram_codes = {};
      // clear old codes for this user
      for (const [k, v] of Object.entries(d.telegram_codes)) {
        if (v === req.user.uid) delete d.telegram_codes[k];
      }
      d.telegram_codes[code] = req.user.uid;
      writeJSON(d);
    }
    res.json({ code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
`;

code = code.replace("app.post('/api/telegram/webhook'", linkRoute + "\napp.post('/api/telegram/webhook'");

// 3. Update Webhook logic
// We need to rewrite the webhook to handle text for linking, and lookup user_id for photos.
// Let's find the webhook body and replace it.

// Read the file and locate the webhook
