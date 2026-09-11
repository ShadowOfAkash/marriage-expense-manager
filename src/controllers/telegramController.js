const { isLibSQL, dbGet, dbRun, readJSON, writeJSON } = require('../db');
const { processTelegramWebhookMessage, handleTelegramCallbackQuery } = require('../services/telegramService');

async function getStatus(req, res) {
  try {
    let isLinked = false;
    let activeCode = null;
    let telegramId = null;

    if (isLibSQL()) {
      const link = await dbGet('SELECT chat_id FROM telegram_links WHERE user_id = ?', [req.user.uid]);
      if (link) {
        isLinked = true;
        telegramId = link.chat_id;
      }
      const codeRow = await dbGet('SELECT code FROM telegram_codes WHERE user_id = ?', [req.user.uid]);
      if (codeRow) activeCode = codeRow.code;
    } else {
      const d = readJSON();
      if (d.telegram_links) {
        for (const [chatId, uid] of Object.entries(d.telegram_links)) {
          if (uid === req.user.uid) {
            isLinked = true;
            telegramId = chatId;
            break;
          }
        }
      }
      if (d.telegram_codes) {
        for (const [k, v] of Object.entries(d.telegram_codes)) {
          if (v === req.user.uid) activeCode = k;
        }
      }
    }
    res.json({ isLinked, activeCode, telegramId, botUsername: 'MarriageExpenseManagementBot' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function generateLinkCode(req, res) {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  try {
    if (isLibSQL()) {
      await dbRun('DELETE FROM telegram_codes WHERE user_id = ?', [req.user.uid]); // clear old
      await dbRun('INSERT INTO telegram_codes (code, user_id) VALUES (?, ?)', [code, req.user.uid]);
    } else {
      const d = readJSON();
      if (!d.telegram_codes) d.telegram_codes = {};
      for (const [k, v] of Object.entries(d.telegram_codes)) {
        if (v === req.user.uid) delete d.telegram_codes[k];
      }
      d.telegram_codes[code] = req.user.uid;
      writeJSON(d);
    }
    res.json({ code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function setTelegramId(req, res) {
  const { telegramId } = req.body;
  if (!telegramId || !String(telegramId).trim()) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }
  const cleanId = String(telegramId).trim();
  try {
    if (isLibSQL()) {
      await dbRun('DELETE FROM telegram_links WHERE user_id = ?', [req.user.uid]);
      await dbRun('INSERT INTO telegram_links (chat_id, user_id) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET user_id=excluded.user_id', [cleanId, req.user.uid]);
      await dbRun('DELETE FROM telegram_codes WHERE user_id = ?', [req.user.uid]);
    } else {
      const d = readJSON();
      if (!d.telegram_links) d.telegram_links = {};
      for (const [k, v] of Object.entries(d.telegram_links)) {
        if (v === req.user.uid) delete d.telegram_links[k];
      }
      d.telegram_links[cleanId] = req.user.uid;
      if (d.telegram_codes) {
        for (const [k, v] of Object.entries(d.telegram_codes)) {
          if (v === req.user.uid) delete d.telegram_codes[k];
        }
      }
      writeJSON(d);
    }
    res.json({ success: true, isLinked: true, telegramId: cleanId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function disconnect(req, res) {
  try {
    if (isLibSQL()) {
      await dbRun('DELETE FROM telegram_links WHERE user_id = ?', [req.user.uid]);
      await dbRun('DELETE FROM telegram_codes WHERE user_id = ?', [req.user.uid]);
    } else {
      const d = readJSON();
      if (d.telegram_links) {
        for (const [k, v] of Object.entries(d.telegram_links)) {
          if (v === req.user.uid) delete d.telegram_links[k];
        }
      }
      if (d.telegram_codes) {
        for (const [k, v] of Object.entries(d.telegram_codes)) {
          if (v === req.user.uid) delete d.telegram_codes[k];
        }
      }
      writeJSON(d);
    }
    res.json({ success: true, isLinked: false, telegramId: null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function handleWebhook(req, res) {
  res.sendStatus(200);
  try {
    if (req.body.message) {
      await processTelegramWebhookMessage(req.body.message);
    } else if (req.body.callback_query) {
      await handleTelegramCallbackQuery(req.body.callback_query);
    }
  } catch (err) {
    console.error('Telegram Webhook error:', err);
  }
}

module.exports = {
  getStatus,
  generateLinkCode,
  setTelegramId,
  disconnect,
  handleWebhook
};
