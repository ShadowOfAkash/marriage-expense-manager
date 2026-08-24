require('dotenv').config();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let lastUpdateId = 0;

async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
    const data = await res.json();
    
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        console.log("Received message from Telegram, forwarding to local server...");
        
        fetch('http://localhost:3000/api/telegram/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        }).catch(err => console.error("Local server error:", err.message));
      }
    }
  } catch (e) {
    console.error("Polling error:", e.message);
  }
  setTimeout(poll, 1000);
}

console.log("🚀 Local Telegram Relay started! Forwarding messages to localhost:3000...");
poll();
