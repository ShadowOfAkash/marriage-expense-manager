const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const oldSendReply = `async function sendReply(text) {
    if (!botToken) return;
    await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ chat_id: chatId, text })
    });
  }`;

const newSendReply = `async function sendReply(text) {
    if (!botToken) return;
    try {
      await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chat_id: chatId, text })
      });
    } catch (e) {
      console.error("Failed to send Telegram reply:", e.message);
    }
  }`;

code = code.replace(oldSendReply, newSendReply);
fs.writeFileSync('server.js', code);
console.log('Fixed sendReply to catch network timeouts!');
