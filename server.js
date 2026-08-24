const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Hardcoded credentials ────────────────────────────────────────────────────
const USERS = [
  { email: 'akashtiwari.mnnit@gmail.com', password: 'Akashcse@25274', name: 'Akash Tiwari' }
];

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT && getApps().length === 0) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
    console.log('✅ Firebase Admin initialized');
  } else if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in environment');
  }
} catch (e) {
  console.error('❌ Failed to initialize Firebase Admin:', e.message);
}

// Keep a fallback for development if they haven't configured it yet

const validTokens = new Set();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// ── Database Setup ───────────────────────────────────────────────────────────
let db;
let useLibSQL = false;

async function initDB() {
  // If Turso env vars are present → use cloud SQLite (Turso)
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    try {
      const { createClient } = require('@libsql/client');
      db = createClient({
        url:       process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      useLibSQL = true;
      console.log('📡 Connected to Turso (cloud SQLite)');
    } catch (e) {
      console.error('Turso connection failed, falling back to JSON:', e.message);
      useLibSQL = false;
    }
  }

  if (useLibSQL) {
    // Create tables in Turso
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS user_budget (
        user_id    TEXT PRIMARY KEY,
        amount     REAL    NOT NULL DEFAULT 0,
        updated_at TEXT    DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     TEXT    NOT NULL DEFAULT 'legacy_user',
        category    TEXT    NOT NULL,
        description TEXT    DEFAULT '',
        amount      REAL    NOT NULL,
        date        TEXT    NOT NULL,
        created_at  TEXT    DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS savings (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    TEXT    NOT NULL DEFAULT 'legacy_user',
        month      TEXT    NOT NULL,
        year       INTEGER NOT NULL,
        amount     REAL    NOT NULL,
        note       TEXT    DEFAULT '',
        created_at TEXT    DEFAULT (datetime('now'))
      );
    `);
    try { await db.execute("ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'approved'"); } catch(e){}
    try { await db.execute("ALTER TABLE expenses ADD COLUMN receipt_url TEXT DEFAULT ''"); } catch(e){}
    try { await db.execute("ALTER TABLE expenses ADD COLUMN user_id TEXT DEFAULT 'legacy_user'"); } catch(e){}
    try { await db.execute("ALTER TABLE savings ADD COLUMN user_id TEXT DEFAULT 'legacy_user'"); } catch(e){}
    console.log('✅ Turso tables ready');
  } else {
    console.log('📁 Using local JSON file database');
  }
}

// ── JSON file DB helpers (local fallback) ────────────────────────────────────
const DB_FILE  = path.join(__dirname, 'marriage_data.json');
const DEFAULT_DB = {
  budget: { amount: 0 }, expenses: [], savings: [],
  _nextExpenseId: 1, _nextSavingsId: 1
};

function readJSON() {
  try {
    if (!fs.existsSync(DB_FILE)) { fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2)); }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch { return JSON.parse(JSON.stringify(DEFAULT_DB)); }
}
function writeJSON(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// ── Unified DB helpers ───────────────────────────────────────────────────────
async function dbGet(sql, args = []) {
  if (useLibSQL) {
    const res = await db.execute({ sql, args });
    return res.rows[0] || null;
  }
  throw new Error('dbGet called in JSON mode');
}
async function dbAll(sql, args = []) {
  if (useLibSQL) {
    const res = await db.execute({ sql, args });
    return res.rows;
  }
  throw new Error('dbAll called in JSON mode');
}
async function dbRun(sql, args = []) {
  if (useLibSQL) {
    const res = await db.execute({ sql, args });
    return { lastInsertRowid: res.lastInsertRowid };
  }
  throw new Error('dbRun called in JSON mode');
}

// ── Auth Middleware ──────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  
  const token = auth.slice(7);
  
  try {
    // Check if Firebase is initialized and verify the token
    if (getApps().length > 0) {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = decodedToken; // contains .uid
      return next();
    }
  } catch (error) {
    console.error("Firebase auth error:", error.message);
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Fallback to legacy mock auth ONLY if Firebase isn't configured yet
  if (getApps().length === 0 && validTokens.has(token)) {
    req.user = { uid: 'legacy_user' };
    return next();
  }
  
  return res.status(401).json({ error: 'Invalid or expired session' });
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const token = Buffer.from(`${email}:${Date.now()}:${Math.random()}`).toString('base64');
  validTokens.add(token);
  res.json({ token, name: user.name, email: user.email });
});

app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) validTokens.delete(auth.slice(7));
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUDGET
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/budget', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      const row = await dbGet('SELECT amount FROM budget WHERE id = 1');
      return res.json({ amount: row?.amount || 0 });
    }
    res.json({ amount: readJSON().budget.amount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/budget', requireAuth, async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || isNaN(amount)) return res.status(400).json({ error: 'Valid amount required' });
  try {
    if (useLibSQL) {
      await dbRun('UPDATE budget SET amount = ?, updated_at = datetime(\'now\') WHERE id = 1', [Number(amount)]);
      return res.json({ success: true, amount: Number(amount) });
    }
    const d = readJSON(); d.budget.amount = Number(amount); writeJSON(d);
    res.json({ success: true, amount: Number(amount) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/summary', requireAuth, async (req, res) => {
  try {
    let budgetAmount, totalExpenses, totalSavings;
    if (useLibSQL) {
      const bRow = await dbGet('SELECT amount FROM budget WHERE id = 1');
      const eRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM expenses');
      const sRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM savings');
      budgetAmount  = bRow?.amount || 0;
      totalExpenses = Number(eRow?.total || 0);
      totalSavings  = Number(sRow?.total || 0);
    } else {
      const d = readJSON();
      budgetAmount  = d.budget.amount || 0;
      totalExpenses = d.expenses.reduce((s, e) => s + e.amount, 0);
      totalSavings  = d.savings.reduce((s, e) => s + e.amount, 0);
    }
    res.json({
      budget: budgetAmount, totalExpenses, totalSavings,
      amountStillRequired: Math.max(0, budgetAmount - totalSavings),
      availableBalance:    totalSavings - totalExpenses,
      savingsProgress:     budgetAmount > 0 ? Math.min(100, (totalSavings  / budgetAmount) * 100) : 0,
      expenseProgress:     budgetAmount > 0 ? Math.min(100, (totalExpenses / budgetAmount) * 100) : 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


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
    const imgBuffer = Buffer.from(arrayBuffer);
    const base64Image = imgBuffer.toString('base64');
    const filename = `tg_${Date.now()}.jpg`;
    const fs = require('fs');
    const dir = require('path').join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(require('path').join(dir, filename), imgBuffer);
    const receipt_url = `/uploads/${filename}`;
    const mimeType = MediaContentType0 || 'image/jpeg';

    // 2. Process with Gemini
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `You are a receipt data extractor. Extract the following from this receipt/bill image:
    1. amount (number, the total final amount paid)
    2. date (string, YYYY-MM-DD format, guess the year if missing based on recent times)
    3. description (string, short summary of the vendor/items, max 5 words)
    4. category (string, MUST be exactly one of these: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

    Return ONLY a raw JSON object with these keys (amount, date, description, category).`;

    const imageParts = [{ inlineData: { data: base64Image, mimeType: mimeType } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim().replace(/^\s*```json/i, '').replace(/^\s*```/i, '').replace(/```\s*$/i, '').trim();
    
    let aiData = JSON.parse(text);

    // 3. Save to database as DRAFT
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || new Date().toISOString().split('T')[0];
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'WhatsApp Upload';
    
    if (useLibSQL) {
      await dbRun(
        'INSERT INTO expenses (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url]
      );
    } else {
      const d = readJSON();
      d.expenses.push({ id: d._nextExpenseId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', receipt_url, created_at: new Date().toISOString() });
      writeJSON(d);
    }

    res.send(`<Response><Message>✅ Receipt scanned successfully! 
Total: ₹${finalAmount}
Category: ${finalCat}

Saved to your portal as a DRAFT. Please review and approve it on the dashboard.</Message></Response>`);
  } catch (e) {
    console.error("WhatsApp Webhook error:", e);
    res.send(`<Response><Message>❌ Error processing receipt: ${e.message}</Message></Response>`);
  }
});


app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately to stop Telegram retries

  console.log('Received webhook body:', JSON.stringify(req.body));
  const msg = req.body.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  async function sendReply(text) {
    if (!botToken) return;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result.file_path;

    // Download image
    const imgRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = 'image/jpeg';

    // Process with Gemini
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `You are a receipt data extractor. Extract the following from this receipt/bill image:
    1. amount (number, the total final amount paid)
    2. date (string, YYYY-MM-DD format, guess the year if missing based on recent times)
    3. description (string, short summary of the vendor/items, max 5 words)
    4. category (string, MUST be exactly one of these: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

    Return ONLY a raw JSON object with these keys (amount, date, description, category).`;

    const imageParts = [{ inlineData: { data: base64Image, mimeType } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim().replace(/^\s*```json/i, '').replace(/^\s*```/i, '').replace(/```\s*$/i, '').trim();
    
    let aiData = JSON.parse(text);

    // Save image to uploads folder
    const fsPath = require('path');
    const uploadsDir = fsPath.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    
    // Create a filename from the telegram file path (e.g. photos/file_2.jpg)
    const ext = fsPath.extname(filePath) || '.jpg';
    const finalName = 'tg_' + Date.now() + '_' + Math.random().toString(36).substring(7) + ext;
    const savePath = fsPath.join(uploadsDir, finalName);
    
    // Write buffer to disk
    fs.writeFileSync(savePath, Buffer.from(arrayBuffer));
    const receipt_url = '/uploads/' + finalName;

    // 3. Save to database as DRAFT
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || new Date().toISOString().split('T')[0];
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'Telegram Upload';
    
    if (useLibSQL) {
      await dbRun(
        'INSERT INTO expenses (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url]
      );
    } else {
      const d = readJSON();
      d.expenses.push({ id: d._nextExpenseId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', receipt_url, created_at: new Date().toISOString() });
      writeJSON(d);
    }

    sendReply(`✅ Receipt scanned successfully!\nTotal: ₹${finalAmount}\nCategory: ${finalCat}\n\nSaved to your portal as a DRAFT. Review it on the dashboard.`);
  } catch (e) {
    console.error("Telegram Webhook error:", e);
    sendReply(`❌ Error processing receipt: ${e.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSES


// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/expenses/scan', requireAuth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { image, mimeType } = req.body;
    const imgBuffer = Buffer.from(image, 'base64');
    const filename = `scan_${Date.now()}.jpg`;
    const fs = require('fs');
    const dir = require('path').join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(require('path').join(dir, filename), imgBuffer);
    const receipt_url = `/uploads/${filename}`;
    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Image data and mimeType are required.' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `You are a receipt data extractor. Extract the following from this receipt/bill image:
    1. amount (number, the total final amount paid)
    2. date (string, YYYY-MM-DD format, guess the year if missing based on recent times)
    3. description (string, short summary of the vendor/items, max 5 words)
    4. category (string, MUST be exactly one of these: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

    Return ONLY a raw JSON object with these keys (amount, date, description, category). Do NOT wrap it in markdown code blocks like \`\`\`json. Return pure JSON only.`;

    const imageParts = [
      {
        inlineData: {
          data: image,
          mimeType: mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    res.json({ ...parsedData, receipt_url });
  } catch (e) {
    console.error("Scan error:", e);
    res.status(500).json({ error: 'Failed to scan receipt: ' + e.message });
  }
});


app.post('/api/upload', requireAuth, (req, res) => {
  try {
    const { file, filename } = req.body;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    const buffer = Buffer.from(file, 'base64');
    const safeName = (filename || 'doc.bin').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const finalName = `doc_${Date.now()}_${safeName}`;
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(path.join(dir, finalName), buffer);
    res.json({ url: `/uploads/${finalName}` });
  } catch(e) {
    console.error("Upload error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/expenses', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) return res.json(await dbAll('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [req.user.uid]));
    res.json([...readJSON().expenses].filter(e => e.user_id === req.user.uid).sort((a, b) => b.date.localeCompare(a.date)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', requireAuth, async (req, res) => {
  const { category, description, amount, date, status, receipt_url } = req.body;
  const finalStatus = status || 'approved';
  if (!category || !amount || !date) return res.status(400).json({ error: 'Category, amount and date required' });
  try {
    if (useLibSQL) {
      const r = await dbRun(
        'INSERT INTO expenses (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',
        [category, description || '', Number(amount), date, finalStatus, receipt_url || '']
      );
      const row = await dbGet('SELECT * FROM expenses WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }
    const d = readJSON();
    const expense = { id: d._nextExpenseId++, category, description: description || '', amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || '', created_at: new Date().toISOString() };
    d.expenses.push(expense); writeJSON(d);
    res.status(201).json(expense);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/expenses/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { category, description, amount, date, status, receipt_url } = req.body;
  const finalStatus = status || 'approved';
  try {
    if (useLibSQL) {
      await dbRun('UPDATE expenses SET category=?,description=?,amount=?,date=?,status=?,receipt_url=? WHERE id=?',
        [category, description || '', Number(amount), date, finalStatus, receipt_url || '', id]);
      const row = await dbGet('SELECT * FROM expenses WHERE id = ?', [id]);
      return res.json(row);
    }
    const d = readJSON(); const idx = d.expenses.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.expenses[idx] = { ...d.expenses[idx], category, description: description || '', amount: Number(amount), date, status: finalStatus, receipt_url: receipt_url || d.expenses[idx].receipt_url || '' };
    writeJSON(d); res.json(d.expenses[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (useLibSQL) { await dbRun('DELETE FROM expenses WHERE id = ?', [id]); return res.json({ success: true }); }
    const d = readJSON(); const idx = d.expenses.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.expenses.splice(idx, 1); writeJSON(d); res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/expenses/categories', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      return res.json(await dbAll(
        'SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses GROUP BY category ORDER BY total DESC'
      ));
    }
    const d = readJSON(); const map = {};
    for (const e of d.expenses) {
      if (!map[e.category]) map[e.category] = { category: e.category, total: 0, count: 0 };
      map[e.category].total += e.amount; map[e.category].count++;
    }
    res.json(Object.values(map).sort((a, b) => b.total - a.total));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// SAVINGS
// ═══════════════════════════════════════════════════════════════════════════
const MONTH_ORDER = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

app.get('/api/savings', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      const rows = await dbAll('SELECT * FROM savings ORDER BY year DESC, id DESC');
      return res.json(rows);
    }
    const d = readJSON();
    res.json([...d.savings].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return MONTH_ORDER.indexOf(b.month) - MONTH_ORDER.indexOf(a.month);
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/savings', requireAuth, async (req, res) => {
  const { month, year, amount, note } = req.body;
  if (!month || !year || !amount) return res.status(400).json({ error: 'Month, year and amount required' });
  try {
    if (useLibSQL) {
      const r = await dbRun(
        'INSERT INTO savings (month, year, amount, note) VALUES (?, ?, ?, ?)',
        [month, parseInt(year), Number(amount), note || '']
      );
      const row = await dbGet('SELECT * FROM savings WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }
    const d = readJSON();
    const saving = { id: d._nextSavingsId++, month, year: parseInt(year), amount: Number(amount), note: note || '', created_at: new Date().toISOString() };
    d.savings.push(saving); writeJSON(d); res.status(201).json(saving);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/savings/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (useLibSQL) { await dbRun('DELETE FROM savings WHERE id = ?', [id]); return res.json({ success: true }); }
    const d = readJSON(); const idx = d.savings.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.savings.splice(idx, 1); writeJSON(d); res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (req, res) => res.status(200).send('OK'));

// ─── Catch-all ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ──────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n💒 Marriage Expense Manager running at:\n   ➜  http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
