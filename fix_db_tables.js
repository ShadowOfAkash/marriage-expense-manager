const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const tableInjection = `
      CREATE TABLE IF NOT EXISTS telegram_links (
        chat_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS telegram_codes (
        code TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
`;

code = code.replace("CREATE TABLE IF NOT EXISTS user_budget (", tableInjection + "      CREATE TABLE IF NOT EXISTS user_budget (");
fs.writeFileSync('server.js', code);
console.log('Added Telegram tables!');
