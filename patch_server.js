const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Add urlencoded middleware
code = code.replace(
  "app.use(express.json({ limit: '10mb' }));",
  "app.use(express.json({ limit: '10mb' }));\napp.use(express.urlencoded({ extended: true }));"
);

// 2. Add ALTER TABLE for status column
code = code.replace(
  "console.log('✅ Turso tables ready');",
  "try { await db.execute(\"ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'approved'\"); } catch(e){}\n    console.log('✅ Turso tables ready');"
);

// 3. Update POST /api/expenses
code = code.replace(
  "const { category, description, amount, date } = req.body;",
  "const { category, description, amount, date, status } = req.body;\n  const finalStatus = status || 'approved';"
).replace(
  "'INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)',\n        [category, description || '', Number(amount), date]",
  "'INSERT INTO expenses (category, description, amount, date, status) VALUES (?, ?, ?, ?, ?)',\n        [category, description || '', Number(amount), date, finalStatus]"
).replace(
  "const expense = { id: d._nextExpenseId++, category, description: description || '', amount: Number(amount), date, created_at: new Date().toISOString() };",
  "const expense = { id: d._nextExpenseId++, category, description: description || '', amount: Number(amount), date, status: finalStatus, created_at: new Date().toISOString() };"
);

// 4. Update PUT /api/expenses/:id
code = code.replace(
  "const { category, description, amount, date } = req.body;",
  "const { category, description, amount, date, status } = req.body;\n  const finalStatus = status || 'approved';"
).replace(
  "'UPDATE expenses SET category=?,description=?,amount=?,date=? WHERE id=?',\n        [category, description || '', Number(amount), date, id]",
  "'UPDATE expenses SET category=?,description=?,amount=?,date=?,status=? WHERE id=?',\n        [category, description || '', Number(amount), date, finalStatus, id]"
).replace(
  "d.expenses[idx] = { ...d.expenses[idx], category, description: description || '', amount: Number(amount), date };",
  "d.expenses[idx] = { ...d.expenses[idx], category, description: description || '', amount: Number(amount), date, status: finalStatus };"
);

// 5. Add WhatsApp Webhook
const webhookCode = `
app.post('/api/whatsapp/webhook', async (req, res) => {
  const { MediaUrl0, MediaContentType0, Body, From } = req.body;
  
  if (!MediaUrl0) {
     return res.send('<Response><Message>Please send a photo of a receipt/bill.</Message></Response>');
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.send('<Response><Message>API Key missing on server.</Message></Response>');

    // 1. Fetch image from Twilio
    const imgRes = await fetch(MediaUrl0);
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = MediaContentType0 || 'image/jpeg';

    // 2. Process with Gemini
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = \`You are a receipt data extractor. Extract the following from this receipt/bill image:
    1. amount (number, the total final amount paid)
    2. date (string, YYYY-MM-DD format, guess the year if missing based on recent times)
    3. description (string, short summary of the vendor/items, max 5 words)
    4. category (string, MUST be exactly one of these: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

    Return ONLY a raw JSON object with these keys (amount, date, description, category).\`;

    const imageParts = [{ inlineData: { data: base64Image, mimeType: mimeType } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim().replace(/^\\s*\`\`\`json/i, '').replace(/^\\s*\`\`\`/i, '').replace(/\`\`\`\\s*$/i, '').trim();
    
    let aiData = JSON.parse(text);

    // 3. Save to database as DRAFT
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || new Date().toISOString().split('T')[0];
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'WhatsApp Upload';
    
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

    res.send(\`<Response><Message>✅ Receipt scanned successfully! 
Total: ₹\${finalAmount}
Category: \${finalCat}

Saved to your portal as a DRAFT. Please review and approve it on the dashboard.</Message></Response>\`);
  } catch (e) {
    console.error("WhatsApp Webhook error:", e);
    res.send(\`<Response><Message>❌ Error processing receipt: \${e.message}</Message></Response>\`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSES
`;

code = code.replace(
  "// ═══════════════════════════════════════════════════════════════════════════\n// EXPENSES",
  webhookCode
);

fs.writeFileSync('server.js', code);
console.log("server.js patched successfully.");
