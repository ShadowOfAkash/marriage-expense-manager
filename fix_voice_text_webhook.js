const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const webhookRegex = /app\.post\('\/api\/telegram\/webhook', async \(req, res\) => \{[\s\S]*?\}\);/m;

const newWebhook = `app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200);

  const msg = req.body.message;
  if (!msg) return;

  const chatId = msg.chat.id.toString();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  async function sendReply(text) {
    if (!botToken) return;
    try {
      await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chat_id: chatId, text })
      });
    } catch (e) { console.error("Failed to send Telegram reply:", e.message); }
  }

  try {
    // 1. Check Link Code
    if (msg.text && (msg.text.startsWith('/link') || msg.text.startsWith('/start'))) {
      const parts = msg.text.split(' ');
      const code = parts[1] ? parts[1].trim() : msg.text.trim();
      let foundUser = null;
      if (typeof useLibSQL !== 'undefined' && useLibSQL) {
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
        return sendReply("✅ Account successfully linked! You can now send photos, voice notes, or text messages here.");
      } else {
        return sendReply("❌ Invalid or expired code. Please generate a new code from the FinanceOS dashboard and reply with it.");
      }
    }

    // 2. Resolve User ID
    let linkedUserId = null;
    if (typeof useLibSQL !== 'undefined' && useLibSQL) {
      const row = await dbGet('SELECT user_id FROM telegram_links WHERE chat_id = ?', [chatId]);
      if (row) linkedUserId = row.user_id;
    } else {
      const d = readJSON();
      if (d.telegram_links) linkedUserId = d.telegram_links[chatId];
    }

    if (!linkedUserId) {
      return sendReply("⚠️ Your Telegram account is not linked to FinanceOS.\\n\\nPlease go to your Dashboard, click 'Connect Telegram' to generate a 6-digit code, and send it here!");
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
      await sendReply("📸 Image received! Processing with AI...");
    } else if (msg.voice) {
      fileIdToDownload = msg.voice.file_id;
      mimeType = msg.voice.mime_type || 'audio/ogg';
      await sendReply("🎙️ Voice note received! Listening with AI...");
    } else if (msg.text) {
      inputText = msg.text;
      await sendReply("✍️ Text received! Processing with AI...");
    } else {
      return sendReply("Please send a photo of a receipt, a voice note, or a text message describing your expense.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return sendReply("API Key missing on server.");

    // Download file if photo or voice
    if (fileIdToDownload) {
      const fileRes = await fetch(\`https://api.telegram.org/bot\${botToken}/getFile?file_id=\${fileIdToDownload}\`);
      const fileData = await fileRes.json();
      const filePath = fileData.result.file_path;

      const fileDataRes = await fetch(\`https://api.telegram.org/file/bot\${botToken}/\${filePath}\`);
      const arrayBuffer = await fileDataRes.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');

      // Only save images to disk for receipts
      if (mimeType.startsWith('image/')) {
        const fsPath = require('path');
        const uploadsDir = fsPath.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const ext = fsPath.extname(filePath) || '.jpg';
        const finalName = 'tg_' + Date.now() + '_' + Math.random().toString(36).substring(7) + ext;
        const savePath = fsPath.join(uploadsDir, finalName);
        fs.writeFileSync(savePath, Buffer.from(arrayBuffer));
        receipt_url = '/uploads/' + finalName;
      }
    }

    // 4. Process with Gemini
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const todayDate = new Date().toISOString().split('T')[0];
    const prompt = \`You are a financial AI assistant processing an expense input. The user has provided either a receipt image, an audio voice note (which might be in Hindi or English), or a text message.
    Extract the expense details, translating any Hindi/regional language into clear English:
    1. amount (number, the total final amount spent)
    2. date (string, YYYY-MM-DD format. If they don't mention a date, use today: \${todayDate})
    3. description (string, short English summary of the expense, max 5 words)
    4. category (string, MUST be exactly one of: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

    Return ONLY a raw JSON object with these keys: amount, date, description, category.\`;

    const parts = [prompt];
    if (inputText) parts.push(inputText);
    if (base64Data) parts.push({ inlineData: { data: base64Data, mimeType } });

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text().trim().replace(/^\\s*\`\`\`json/i, '').replace(/^\\s*\`\`\`/i, '').replace(/\`\`\`\\s*$/i, '').trim();
    
    let aiData = JSON.parse(text);

    // 5. Save to database using the LINKED user_id!
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || todayDate;
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'Telegram Upload';
    
    if (useLibSQL) {
      await dbRun(
        'INSERT INTO expenses (category, description, amount, date, status, receipt_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url, linkedUserId]
      );
    } else {
      const d = readJSON();
      d.expenses.push({ id: d._nextExpenseId++, user_id: linkedUserId, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', receipt_url, created_at: new Date().toISOString() });
      writeJSON(d);
    }

    sendReply(\`✅ Expense logged successfully!\\nAmount: ₹\${finalAmount}\\nCategory: \${finalCat}\\nNotes: \${finalDesc}\\n\\nSaved to your portal as a DRAFT.\`);
  } catch (e) {
    console.error("Telegram Webhook error:", e);
    sendReply(\`❌ Error processing expense: \${e.message}\`);
  }
});`;

code = code.replace(webhookRegex, newWebhook);
fs.writeFileSync('server.js', code);
console.log('Webhook upgraded to multimodal (image, voice, text)!');
