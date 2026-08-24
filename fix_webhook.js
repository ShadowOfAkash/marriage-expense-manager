const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const webhookRegex = /app\.post\('\/api\/telegram\/webhook', async \(req, res\) => \{[\s\S]*?\}\);/m;

const newWebhook = `app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately to stop Telegram retries

  console.log('Received webhook body:', JSON.stringify(req.body));
  const msg = req.body.message;
  if (!msg) return;

  const chatId = msg.chat.id.toString();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  async function sendReply(text) {
    if (!botToken) return;
    await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ chat_id: chatId, text })
    });
  }

  try {
    // 1. Check if user is linking account via text
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
        return sendReply("✅ Account successfully linked! You can now send photos of receipts and they will appear directly in your dashboard.");
      } else {
        return sendReply("❌ Invalid or expired code. Please generate a new code from the FinanceOS dashboard and reply with it.");
      }
    }

    // 2. Resolve User ID for this chat
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

    // 3. Process Photo
    if (!msg.photo || msg.photo.length === 0) {
      return sendReply("Please send a photo of a receipt/bill.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return sendReply("API Key missing on server.");

    await sendReply("📸 Receipt received! Analyzing with AI...");

    // Get largest photo
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    
    // Fetch file path
    const fileRes = await fetch(\`https://api.telegram.org/bot\${botToken}/getFile?file_id=\${fileId}\`);
    const fileData = await fileRes.json();
    const filePath = fileData.result.file_path;

    // Download image
    const imgRes = await fetch(\`https://api.telegram.org/file/bot\${botToken}/\${filePath}\`);
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = 'image/jpeg';

    // Process with Gemini
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = \`You are a receipt data extractor. Extract the following from this receipt/bill image:
    1. amount (number, the total final amount paid)
    2. date (string, YYYY-MM-DD format, guess the year if missing based on recent times)
    3. description (string, short summary of the vendor/items, max 5 words)
    4. category (string, MUST be exactly one of these: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

    Return ONLY a raw JSON object with these keys (amount, date, description, category).\`;

    const imageParts = [{ inlineData: { data: base64Image, mimeType } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim().replace(/^\\s*\`\`\`json/i, '').replace(/^\\s*\`\`\`/i, '').replace(/\`\`\`\\s*$/i, '').trim();
    
    let aiData = JSON.parse(text);

    // Save image to uploads folder
    const fsPath = require('path');
    const uploadsDir = fsPath.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    
    const ext = fsPath.extname(filePath) || '.jpg';
    const finalName = 'tg_' + Date.now() + '_' + Math.random().toString(36).substring(7) + ext;
    const savePath = fsPath.join(uploadsDir, finalName);
    
    fs.writeFileSync(savePath, Buffer.from(arrayBuffer));
    const receipt_url = '/uploads/' + finalName;

    // 4. Save to database using the LINKED user_id!
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || new Date().toISOString().split('T')[0];
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

    sendReply(\`✅ Receipt scanned successfully!\\nTotal: ₹\${finalAmount}\\nCategory: \${finalCat}\\n\\nSaved to your private portal as a DRAFT.\`);
  } catch (e) {
    console.error("Telegram Webhook error:", e);
    sendReply(\`❌ Error processing receipt: \${e.message}\`);
  }
});`;

code = code.replace(webhookRegex, newWebhook);
fs.writeFileSync('server.js', code);
console.log('Webhook patched for account linking!');
