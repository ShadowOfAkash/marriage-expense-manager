const fs = require('fs');
let code = fs.readFileSync('client/src/utils/api.js', 'utf8');

code = code.replace(
  "generateTelegramCode: () => fetchWithAuth('/api/telegram/link-code', { method: 'POST' }),",
  "generateTelegramCode: () => fetchWithAuth('/api/telegram/link-code', { method: 'POST' }),\n  getTelegramStatus: () => fetchWithAuth('/api/telegram/status'),"
);
fs.writeFileSync('client/src/utils/api.js', code);
console.log('Patched API.js for getTelegramStatus!');
