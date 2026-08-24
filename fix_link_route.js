const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const linkRoute = `
// ═══════════════════════════════════════════════════════════════════════════
// TELEGRAM ACCOUNT LINKING
// ═══════════════════════════════════════════════════════════════════════════
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
fs.writeFileSync('server.js', code);
console.log('Added /api/telegram/link-code successfully!');
