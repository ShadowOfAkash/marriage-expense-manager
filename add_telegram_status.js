const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const statusRoute = `
app.get('/api/telegram/status', requireAuth, async (req, res) => {
  try {
    let isLinked = false;
    let activeCode = null;

    if (typeof useLibSQL !== 'undefined' && useLibSQL) {
      const link = await dbGet('SELECT chat_id FROM telegram_links WHERE user_id = ?', [req.user.uid]);
      if (link) isLinked = true;
      const codeRow = await dbGet('SELECT code FROM telegram_codes WHERE user_id = ?', [req.user.uid]);
      if (codeRow) activeCode = codeRow.code;
    } else {
      const d = readJSON();
      if (d.telegram_links && Object.values(d.telegram_links).includes(req.user.uid)) {
        isLinked = true;
      }
      if (d.telegram_codes) {
        for (const [k, v] of Object.entries(d.telegram_codes)) {
          if (v === req.user.uid) activeCode = k;
        }
      }
    }
    res.json({ isLinked, activeCode });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
`;

code = code.replace("app.post('/api/telegram/link-code'", statusRoute + "\napp.post('/api/telegram/link-code'");
fs.writeFileSync('server.js', code);
console.log('Added /api/telegram/status route!');
