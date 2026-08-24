const fs = require('fs');
let code = fs.readFileSync('client/src/utils/api.js', 'utf8');

code = code.replace(
  "export const api = {",
  "export const api = {\n  // Telegram\n  generateTelegramCode: () => fetchWithAuth('/api/telegram/link-code', { method: 'POST' }),"
);

fs.writeFileSync('client/src/utils/api.js', code);
console.log('Frontend API patched!');
