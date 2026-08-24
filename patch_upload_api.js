const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const uploadRoute = `
app.post('/api/upload', requireAuth, (req, res) => {
  try {
    const { file, filename } = req.body;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    const buffer = Buffer.from(file, 'base64');
    const safeName = (filename || 'doc.bin').replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    const finalName = \`doc_\${Date.now()}_\${safeName}\`;
    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(path.join(__dirname, 'public/uploads', finalName), buffer);
    res.json({ url: \`/uploads/\${finalName}\` });
  } catch(e) {
    console.error("Upload error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/expenses', requireAuth, async (req, res) => {`;

code = code.replace(
  "app.get('/api/expenses', requireAuth, async (req, res) => {",
  uploadRoute
);

fs.writeFileSync('server.js', code);
console.log("server.js patched for /api/upload.");
