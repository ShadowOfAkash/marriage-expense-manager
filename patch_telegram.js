const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const telegramWebhookCode = `
app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately to stop Telegram retries

  const msg = req.body.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  async function sendReply(text) {
    if (!botToken) return;
    await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ chat_id: chatId, text })
    });
  }

  if (!msg.photo || msg.photo.length === 0) {
    return sendReply("Please send a photo of a receipt/bill.");
  }

  try {
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

    // 3. Save to database as DRAFT
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || new Date().toISOString().split('T')[0];
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'Telegram Upload';
    
    if (useLibSQL) {
      await dbRun(
        'INSERT INTO expenses (category, description, amount, date, status) VALUES (?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft']
      );
    } else {
      const d = readJSON();
      d.expenses.push({ id: d._nextExpenseId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', created_at: new Date().toISOString() });
      writeJSON(d);
    }

    sendReply(\`✅ Receipt scanned successfully!\\nTotal: ₹\${finalAmount}\\nCategory: \${finalCat}\\n\\nSaved to your portal as a DRAFT. Review it on the dashboard.\`);
  } catch (e) {
    console.error("Telegram Webhook error:", e);
    sendReply(\`❌ Error processing receipt: \${e.message}\`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSES
`;

code = code.replace(
  "// ═══════════════════════════════════════════════════════════════════════════\n// EXPENSES",
  telegramWebhookCode
);

fs.writeFileSync('server.js', code);
console.log("server.js patched for Telegram.");
