const fs = require('fs');

// 1. Add /api/health to server.js
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace(
  "// ─── Catch-all ──────────────────────────────────────────────────────────────",
  "app.get('/api/health', (req, res) => res.status(200).send('OK'));\n\n// ─── Catch-all ──────────────────────────────────────────────────────────────"
);

// 2. Change port binding to 0.0.0.0
code = code.replace(
  "app.listen(PORT, () => {",
  "app.listen(PORT, '0.0.0.0', () => {"
);
fs.writeFileSync('server.js', code);

// 3. Update railway.json
let rw = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
rw.deploy.healthcheckPath = "/api/health";
fs.writeFileSync('railway.json', JSON.stringify(rw, null, 2));

console.log("Healthcheck fixed.");
