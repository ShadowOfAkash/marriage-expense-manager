const path = require('path');
const fs   = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { UPLOADS_DIR } = require('../config/env');
const { isLibSQL, dbGet, dbRun, readJSON, writeJSON } = require('../db');

async function sendTelegramReply(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (e) {
    console.error('Failed to send Telegram reply:', e.message);
  }
}

async function processTelegramWebhookMessage(msg) {
  if (!msg) return;

  const chatId = msg.chat.id.toString();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // 1. Check Link Code
  if (msg.text && (msg.text.startsWith('/link') || msg.text.startsWith('/start'))) {
    const parts = msg.text.split(' ');
    const code = parts[1] ? parts[1].trim() : msg.text.trim();
    let foundUser = null;
    if (isLibSQL()) {
      const row = await dbGet('SELECT user_id FROM telegram_codes WHERE code = ?', [code]);
      if (row) {
        foundUser = row.user_id;
        await dbRun('INSERT INTO telegram_links (chat_id, user_id) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET user_id=excluded.user_id', [chatId, foundUser]);
        await dbRun('DELETE FROM telegram_codes WHERE code = ?', [code]);
      }
    } else {
      const d = readJSON();
      if (d.telegram_codes && d.telegram_codes[code]) {
        foundUser = d.telegram_codes[code];
        if (!d.telegram_links) d.telegram_links = {};
        d.telegram_links[chatId] = foundUser;
        delete d.telegram_codes[code];
        writeJSON(d);
      }
    }

    if (foundUser) {
      return sendTelegramReply(chatId, '✅ Account successfully linked! You can now send photos, voice notes, or text messages here.');
    } else {
      return sendTelegramReply(chatId, '❌ Invalid or expired code. Please generate a new code from the FinanceOS dashboard and reply with it.');
    }
  }

  // 2. Resolve User ID
  let linkedUserId = null;
  if (isLibSQL()) {
    const row = await dbGet('SELECT user_id FROM telegram_links WHERE chat_id = ?', [chatId]);
    if (row) linkedUserId = row.user_id;
  } else {
    const d = readJSON();
    if (d.telegram_links) linkedUserId = d.telegram_links[chatId];
  }

  if (!linkedUserId) {
    return sendTelegramReply(chatId, "⚠️ Your Telegram account is not linked to FinanceOS.\n\nPlease go to your Dashboard, click 'Connect Telegram' to generate a 6-digit code, and send it here!");
  }

  // 3. Collect Input (Photo, Voice, Text)
  let base64Data = null;
  let mimeType = null;
  let inputText = null;
  let receipt_url = '';
  let fileIdToDownload = null;

  if (msg.photo && msg.photo.length > 0) {
    fileIdToDownload = msg.photo[msg.photo.length - 1].file_id;
    mimeType = 'image/jpeg';
    await sendTelegramReply(chatId, '📸 Image received! Processing with AI...');
  } else if (msg.voice) {
    fileIdToDownload = msg.voice.file_id;
    mimeType = msg.voice.mime_type || 'audio/ogg';
    await sendTelegramReply(chatId, '🎙️ Voice note received! Listening with AI...');
  } else if (msg.text) {
    inputText = msg.text;
    await sendTelegramReply(chatId, '✍️ Text received! Processing with AI...');
  } else {
    return sendTelegramReply(chatId, 'Please send a photo of a receipt, a voice note, or a text message describing your expense.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return sendTelegramReply(chatId, 'API Key missing on server.');

  // Download file if photo or voice
  if (fileIdToDownload) {
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileIdToDownload}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result.file_path;

    const fileDataRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
    const arrayBuffer = await fileDataRes.arrayBuffer();
    base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Only save images to disk for receipts
    if (mimeType.startsWith('image/')) {
      if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      const ext = path.extname(filePath) || '.jpg';
      const finalName = 'tg_' + Date.now() + '_' + Math.random().toString(36).substring(7) + ext;
      const savePath = path.join(UPLOADS_DIR, finalName);
      fs.writeFileSync(savePath, Buffer.from(arrayBuffer));
      receipt_url = '/uploads/' + finalName;
    }
  }

  // 4. Process with Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const todayDate = new Date().toISOString().split('T')[0];
  const prompt = `You are a financial AI assistant processing an expense input. The user has provided either a receipt image, an audio voice note (which might be in Hindi or English), or a text message.
  Extract the expense details, translating any Hindi/regional language into clear English:
  1. amount (number, the total final amount spent)
  2. date (string, YYYY-MM-DD format. If they don't mention a date, use today: ${todayDate})
  3. description (string, short English summary of the expense, max 5 words)
  4. category (string, MUST be exactly one of: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

  Return ONLY a raw JSON object with these keys: amount, date, description, category.`;

  const parts = [prompt];
  if (inputText) parts.push(inputText);
  if (base64Data) parts.push({ inlineData: { data: base64Data, mimeType } });

  const result = await model.generateContent(parts);
  const response = await result.response;
  const text = response.text().trim().replace(/^\s*```json/i, '').replace(/^\s*```/i, '').replace(/```\s*$/i, '').trim();

  let aiData = JSON.parse(text);

  // 5. Save to database using the LINKED user_id
  const finalAmount = Number(aiData.amount) || 0;
  const finalDate = aiData.date || todayDate;
  const finalCat = aiData.category || 'Miscellaneous';
  const finalDesc = aiData.description || 'Telegram Upload';

  if (isLibSQL()) {
    await dbRun(
      'INSERT INTO payments (category, description, amount, date, status, receipt_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url, linkedUserId]
    );
  } else {
    const d = readJSON();
    const newPay = {
      id: d._nextPaymentId++,
      user_id: linkedUserId,
      category: finalCat,
      description: finalDesc,
      amount: finalAmount,
      date: finalDate,
      status: 'draft',
      receipt_url,
      created_at: new Date().toISOString()
    };
    d.payments.push(newPay);
    writeJSON(d);
  }

  sendTelegramReply(chatId, `✅ Expense logged successfully!\nAmount: ₹${finalAmount}\nCategory: ${finalCat}\nNotes: ${finalDesc}\n\nSaved to your portal as a DRAFT.`);
}

module.exports = {
  sendTelegramReply,
  processTelegramWebhookMessage
};
