const path = require('path');
const fs   = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { UPLOADS_DIR } = require('../config/env');
const { isLibSQL, dbGet, dbRun, readJSON, writeJSON } = require('../db');
const { generateInvitationPDF } = require('./pdfService');

function generateTelegramInvitationText(guest, baseUrl = 'http://localhost:3000') {
  const name = guest.name || 'आदरणीय अतिथि';
  const rsvpToken = guest.rsvp_token;
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const rsvpUrl = `${cleanBase}/rsvp/${rsvpToken}`;
  const pdfUrl = `${cleanBase}/api/guests/${guest.id}/invitation-pdf`;
  
  const eventsList = Array.isArray(guest.events) && guest.events.length > 0
    ? guest.events.map(e => `• ${e}`).join('\n')
    : '• शुभ विवाह एवं समस्त वैवाहिक कार्यक्रम';

  return `🌸 卐 श्री गणेशाय नमः 卐 🌸\n\n` +
    `प्रिय *${name}* जी,\n\n` +
    `सस्नेह निमंत्रण! हमारे परिवार के शुभ विवाह समारोह में आप सपरिवार सादर आमंत्रित हैं। 💒✨\n\n` +
    `📅 *शुभ कार्यक्रम:*\n${eventsList}\n\n` +
    `💌 *कृपया अपनी उपस्थिति (RSVP) कन्फर्म करें:*\n👉 ${rsvpUrl}\n\n` +
    `📄 *डिजिटल आमंत्रण पत्रिका (PDF) डाउनलोड करें:*\n👉 ${pdfUrl}\n\n` +
    `आपके पावन आशीर्वाद एवं स्नेह की प्रतीक्षा में,\n` +
    `*तिवारी परिवार* 💐`;
}

async function sendTelegramReply(chatId, text, options = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: options.parse_mode || undefined,
      reply_markup: options.reply_markup || undefined
    };
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to send Telegram reply:', e.message);
    return null;
  }
}

async function sendTelegramDocument(chatId, documentBuffer, filename, caption = '') {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;
  try {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    const blob = new Blob([documentBuffer], { type: 'application/pdf' });
    formData.append('document', blob, filename);

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to send Telegram document:', e.message);
    return null;
  }
}

async function handleTelegramCallbackQuery(callbackQuery) {
  if (!callbackQuery || !callbackQuery.data) return;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = callbackQuery.message?.chat?.id?.toString();
  const data = callbackQuery.data;

  // Format: rsvp:<status>:<token>
  if (data.startsWith('rsvp:')) {
    const parts = data.split(':');
    const newStatus = parts[1]; // Confirmed, Maybe, Declined
    const token = parts[2];

    try {
      let guest = null;
      const tokenAlt = token.startsWith('rsvp_') ? token.replace(/^rsvp_/, '') : `rsvp_${token}`;
      if (isLibSQL()) {
        const row = await dbGet('SELECT * FROM guests WHERE rsvp_token = ? OR rsvp_token = ?', [token, tokenAlt]);
        if (row) {
          await dbRun(`
            UPDATE guests SET
              rsvp_status = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `, [newStatus, row.id]);
          guest = row;
        }
      } else {
        const d = readJSON();
        const idx = (d.guests || []).findIndex(g => g.rsvp_token === token || g.rsvp_token === tokenAlt);
        if (idx !== -1) {
          d.guests[idx].rsvp_status = newStatus;
          d.guests[idx].updated_at = new Date().toISOString();
          writeJSON(d);
          guest = d.guests[idx];
        }
      }

      if (botToken && callbackQuery.id) {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: `✅ उपस्थिति दर्ज: ${newStatus}`,
            show_alert: true
          })
        });
      }

      if (chatId) {
        const statusHindi = newStatus === 'Confirmed' ? 'आ रहे हैं (Confirmed)' : (newStatus === 'Maybe' ? 'सम्भावित (Maybe)' : 'नहीं आ पाएंगे (Declined)');
        await sendTelegramReply(
          chatId,
          `✅ बहुत बहुत धन्यवाद ${guest?.name || ''} जी!\n\nआपका उत्तर: *${statusHindi}* सफलतापूर्वक दर्ज कर लिया गया है।\n\nसमारोह में आपके दर्शन की प्रतीक्षा रहेगी! 💐`,
          { parse_mode: 'Markdown' }
        );

        // Notify Host (Admin) if host has linked telegram
        if (guest?.user_id) {
          let hostChatId = null;
          if (isLibSQL()) {
            const hLink = await dbGet('SELECT chat_id FROM telegram_links WHERE user_id = ?', [guest.user_id]);
            if (hLink) hostChatId = hLink.chat_id;
          } else {
            const d = readJSON();
            for (const [cId, uId] of Object.entries(d.telegram_links || {})) {
              if (uId === guest.user_id) { hostChatId = cId; break; }
            }
          }
          if (hostChatId && hostChatId !== chatId) {
            await sendTelegramReply(
              hostChatId,
              `🎉 *Guest RSVP Update!*\n\nअतिथि: *${guest.name}*\nस्थिति: *${newStatus}*\nफोन: ${guest.phone || 'N/A'}\nपक्ष: ${guest.side || 'General'}`,
              { parse_mode: 'Markdown' }
            );
          }
        }
      }
    } catch (e) {
      console.error('Error handling Telegram RSVP callback:', e);
    }
  }
}

async function processTelegramWebhookMessage(msg) {
  if (!msg) return;

  const chatId = msg.chat.id.toString();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // 1. Check RSVP Invitation Deep Link: /start rsvp_<token>
  if (msg.text && (msg.text.startsWith('/start rsvp_') || msg.text.startsWith('/rsvp_') || msg.text.startsWith('/start rsvp'))) {
    let token = msg.text.replace(/^\/start\s+/, '').replace(/^\//, '').trim();
    if (token.startsWith('rsvp_rsvp_')) {
      token = token.replace(/^rsvp_/, '');
    }
    const tokenAlt = token.startsWith('rsvp_') ? token.replace(/^rsvp_/, '') : `rsvp_${token}`;

    try {
      let guest = null;
      if (isLibSQL()) {
        const row = await dbGet('SELECT * FROM guests WHERE rsvp_token = ? OR rsvp_token = ?', [token, tokenAlt]);
        if (row) {
          guest = row;
          await dbRun('UPDATE guests SET telegram_chat_id = ? WHERE id = ?', [chatId, row.id]);
        }
      } else {
        const d = readJSON();
        const item = (d.guests || []).find(g => g.rsvp_token === token || g.rsvp_token === tokenAlt);
        if (item) {
          item.telegram_chat_id = chatId;
          writeJSON(d);
          guest = item;
        }
      }

      if (guest) {
        const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
        const rsvpUrl = `${baseUrl.replace(/\/+$/, '')}/rsvp/${token}`;
        const welcomeText = `🌸 卐 श्री गणेशाय नमः 卐 🌸\n\n` +
          `नमस्ते *${guest.name}* जी!\n` +
          `हमारे परिवार के शुभ विवाह समारोह में आपका और आपके परिवार का हार्दिक स्वागत है। 💒✨\n\n` +
          `कृपया नीचे दिए गए बटन्स पर क्लिक करके अपनी उपस्थिति (RSVP) कन्फर्म करें:`;

        const keyboard = {
          inline_keyboard: [
            [
              { text: '✅ आ रहे हैं (Confirm)', callback_data: `rsvp:Confirmed:${token}` },
              { text: '❓ सम्भावित (Maybe)', callback_data: `rsvp:Maybe:${token}` }
            ],
            [
              { text: '❌ नहीं आ पाएंगे (Decline)', callback_data: `rsvp:Declined:${token}` }
            ],
            [
              { text: '🌐 संपूर्ण विवरण व RSVP पोर्टल', url: rsvpUrl }
            ]
          ]
        };

        await sendTelegramReply(chatId, welcomeText, { parse_mode: 'Markdown', reply_markup: keyboard });

        // Generate and send PDF card
        try {
          const pdfBuffer = await generateInvitationPDF(guest, baseUrl);
          await sendTelegramDocument(
            chatId,
            pdfBuffer,
            `Wedding_Invitation_${(guest.name || 'Guest').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            `📜 डिजिटल आमंत्रण पत्रिका - ${guest.name}`
          );
        } catch (pdfErr) {
          console.error('Failed to send PDF card in Telegram:', pdfErr);
        }
        return;
      } else {
        return sendTelegramReply(chatId, '❌ निमंत्रण लिंक अमान्य या समाप्त हो गया है। कृपया अपने आमंत्रण लिंक की जाँच करें।');
      }
    } catch (e) {
      console.error('Error processing Telegram RSVP start:', e);
    }
  }

  // 2. Check Account Link Code: /link <code> or /start <code>
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

  // 3. Resolve User ID for Expense Logging
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
  sendTelegramDocument,
  generateTelegramInvitationText,
  handleTelegramCallbackQuery,
  processTelegramWebhookMessage
};
