const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
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
    // Migrate existing expenses table to payments if present
    try { await db.execute("ALTER TABLE expenses RENAME TO payments"); } catch(e){}

    // Create tables in Turso
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS telegram_links (
        chat_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS telegram_codes (
        code TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS user_budget (
        user_id    TEXT PRIMARY KEY,
        amount     REAL    NOT NULL DEFAULT 0,
        updated_at TEXT    DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS payments (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     TEXT    NOT NULL DEFAULT 'legacy_user',
        category    TEXT    NOT NULL,
        description TEXT    DEFAULT '',
        amount      REAL    NOT NULL,
        date        TEXT    NOT NULL,
        status      TEXT    DEFAULT 'approved',
        receipt_url TEXT    DEFAULT '',
        payment_type TEXT   DEFAULT 'Normal',
        booking_id  INTEGER DEFAULT NULL,
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

      CREATE TABLE IF NOT EXISTS email_settings (
        user_id     TEXT PRIMARY KEY,
        provider    TEXT DEFAULT 'gmail',
        smtp_host   TEXT DEFAULT '',
        smtp_port   INTEGER DEFAULT 587,
        smtp_secure INTEGER DEFAULT 0,
        smtp_user   TEXT DEFAULT '',
        smtp_pass   TEXT DEFAULT '',
        sender_name TEXT DEFAULT '',
        created_at  TEXT DEFAULT (datetime('now')),
        updated_at  TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id      TEXT    NOT NULL DEFAULT 'legacy_user',
        vendor       TEXT    NOT NULL,
        service      TEXT    NOT NULL,
        category     TEXT    DEFAULT 'Miscellaneous',
        booking_date TEXT    DEFAULT '',
        event_date   TEXT    DEFAULT '',
        amount       REAL    DEFAULT 0,
        advance      REAL    DEFAULT 0,
        status       TEXT    DEFAULT 'Pending',
        notes        TEXT    DEFAULT '',
        created_at   TEXT    DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS guests (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        guest_id              TEXT    UNIQUE,
        user_id               TEXT    NOT NULL DEFAULT 'legacy_user',
        name                  TEXT    NOT NULL,
        phone                 TEXT    DEFAULT '',
        email                 TEXT    DEFAULT '',
        gender                TEXT    DEFAULT '',
        age_group             TEXT    DEFAULT 'Adult',
        side                  TEXT    DEFAULT 'Bride',
        relationship_category TEXT    DEFAULT 'Family',
        relationship_detail   TEXT    DEFAULT '',
        guest_type            TEXT    DEFAULT 'Individual',
        household_name        TEXT    DEFAULT '',
        household_role        TEXT    DEFAULT 'Primary',
        plus_one_allowed      INTEGER DEFAULT 0,
        plus_one_name         TEXT    DEFAULT '',
        rsvp_status           TEXT    DEFAULT 'Pending Invitation',
        expected_adults       INTEGER DEFAULT 1,
        expected_children     INTEGER DEFAULT 0,
        expected_attendees    INTEGER DEFAULT 1,
        actual_attendance     TEXT    DEFAULT 'Pending',
        actual_attendees      INTEGER DEFAULT 0,
        check_in_status       INTEGER DEFAULT 0,
        check_in_time         TEXT    DEFAULT NULL,
        food_preference       TEXT    DEFAULT 'Vegetarian',
        special_requirements  TEXT    DEFAULT '',
        notes                 TEXT    DEFAULT '',
        tags                  TEXT    DEFAULT '[]',
        events                TEXT    DEFAULT '[]',
        dependents            TEXT    DEFAULT '[]',
        invitation_sent_at    TEXT    DEFAULT NULL,
        rsvp_token            TEXT    DEFAULT NULL,
        rsvp_response_note    TEXT    DEFAULT '',
        stay_preference       TEXT    DEFAULT 'No need of stay',
        created_at            TEXT    DEFAULT (datetime('now')),
        updated_at            TEXT    DEFAULT (datetime('now'))
      );
    `);
    // Backward compatibility view for legacy queries
    try { await db.execute("CREATE VIEW IF NOT EXISTS expenses AS SELECT * FROM payments"); } catch(e){}
    try { await db.execute("ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'approved'"); } catch(e){}
    try { await db.execute("ALTER TABLE payments ADD COLUMN receipt_url TEXT DEFAULT ''"); } catch(e){}
    try { await db.execute("ALTER TABLE payments ADD COLUMN user_id TEXT DEFAULT 'legacy_user'"); } catch(e){}
    try { await db.execute("ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'Normal'"); } catch(e){}
    try { await db.execute("ALTER TABLE payments ADD COLUMN booking_id INTEGER DEFAULT NULL"); } catch(e){}
    try { await db.execute("ALTER TABLE bookings ADD COLUMN category TEXT DEFAULT 'Miscellaneous'"); } catch(e){}
    try { await db.execute("ALTER TABLE savings ADD COLUMN user_id TEXT DEFAULT 'legacy_user'"); } catch(e){}
    try { await db.execute("ALTER TABLE guests ADD COLUMN dependents TEXT DEFAULT '[]'"); } catch(e){}
    try { await db.execute("ALTER TABLE guests ADD COLUMN invitation_sent_at TEXT DEFAULT NULL"); } catch(e){}
    try { await db.execute("ALTER TABLE guests ADD COLUMN rsvp_token TEXT DEFAULT NULL"); } catch(e){}
    try { await db.execute("ALTER TABLE guests ADD COLUMN rsvp_response_note TEXT DEFAULT ''"); } catch(e){}
    try { await db.execute("ALTER TABLE guests ADD COLUMN stay_preference TEXT DEFAULT 'No need of stay'"); } catch(e){}
    try { await db.execute("UPDATE guests SET rsvp_status = 'Pending Invitation' WHERE rsvp_status = 'Not Responded' OR rsvp_status IS NULL"); } catch(e){}
    console.log('✅ Turso tables ready');
  } else {
    console.log('📁 Using local JSON file database');
  }
}

// ── JSON file DB helpers (local fallback) ────────────────────────────────────
const DB_FILE  = path.join(__dirname, 'marriage_data.json');
const DEFAULT_DB = {
  budget: { amount: 0 }, payments: [], expenses: [], savings: [], bookings: [], guests: [],
  _nextPaymentId: 1, _nextExpenseId: 1, _nextSavingsId: 1, _nextGuestId: 1001
};

function readJSON() {
  try {
    if (!fs.existsSync(DB_FILE)) { fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2)); }
    const d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!d.payments) {
      d.payments = d.expenses || [];
    }
    // Mirror expenses and payments so either key references the same array
    d.expenses = d.payments;
    if (!d.bookings) d.bookings = [];
    if (!d.savings) d.savings = [];
    if (!d.guests) d.guests = [];
    if (d.guests && Array.isArray(d.guests)) {
      let migrated = false;
      d.guests.forEach(g => {
        if (g.rsvp_status === 'Not Responded' || !g.rsvp_status) {
          g.rsvp_status = 'Pending Invitation';
          migrated = true;
        }
        if (!g.rsvp_token) {
          g.rsvp_token = generateRsvpToken(g.id);
          migrated = true;
        }
      });
      if (migrated) writeJSON(d);
    }
    if (!d._nextPaymentId) {
      d._nextPaymentId = d._nextExpenseId || (d.payments.length ? Math.max(...d.payments.map(p => p.id || 0)) + 1 : 1);
    }
    d._nextExpenseId = d._nextPaymentId;
    if (!d._nextGuestId) {
      d._nextGuestId = d.guests.length ? Math.max(...d.guests.map(g => g.id || 0)) + 1 : 1001;
    }
    return d;
  } catch { return JSON.parse(JSON.stringify(DEFAULT_DB)); }
}
function writeJSON(data) {
  if (data.payments) {
    data.expenses = data.payments;
  } else if (data.expenses) {
    data.payments = data.expenses;
  }
  if (data._nextPaymentId) {
    data._nextExpenseId = data._nextPaymentId;
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

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

  // ── Path 1: Firebase Admin is initialized — full verification ──
  if (getApps().length > 0) {
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      // Map known email to the legacy data UID
      if (decodedToken.email === 'akashtiwari.mnnit@gmail.com') {
        console.log(`[Auth] Mapping Google UID ${decodedToken.uid} → jzSCJChQ1OTinp3PESQzSNeCGlp1 for ${decodedToken.email}`);
        decodedToken.uid = 'jzSCJChQ1OTinp3PESQzSNeCGlp1';
      }
      req.user = decodedToken;
      console.log(`[Auth] Verified Firebase token. uid=${req.user.uid} email=${decodedToken.email}`);
      return next();
    } catch (error) {
      console.error('Firebase auth error:', error.message);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  }

  // ── Path 2: No Firebase Admin — decode JWT payload locally (dev fallback) ──
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      let uid = payload.user_id || payload.sub || payload.uid;
      const email = payload.email || '';
      if (email === 'akashtiwari.mnnit@gmail.com') {
        uid = 'jzSCJChQ1OTinp3PESQzSNeCGlp1';
      }
      if (uid) {
        req.user = { uid, email };
        console.log(`[Auth] Decoded JWT locally. uid=${uid} email=${email}`);
        return next();
      }
    }
  } catch (e) {
    // malformed token — fall through
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
    const d = readJSON();
    res.json({ amount: d.user_budgets?.[req.user.uid]?.amount || d.budget?.amount || 0 });
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
    const d = readJSON();
    if (!d.user_budgets) d.user_budgets = {};
    if (!d.user_budgets[req.user.uid]) d.user_budgets[req.user.uid] = {};
    d.user_budgets[req.user.uid].amount = Number(amount);
    d.budget.amount = Number(amount);
    writeJSON(d);
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
      const bRow = await dbGet('SELECT amount FROM user_budget WHERE user_id = ?', [req.user.uid]);
      const eRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE user_id = ?', [req.user.uid]);
      const sRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM savings WHERE user_id = ?', [req.user.uid]);
      budgetAmount  = bRow?.amount || 0;
      totalExpenses = Number(eRow?.total || 0);
      totalSavings  = Number(sRow?.total || 0);
    } else {
      const d = readJSON();
      budgetAmount  = d.user_budgets?.[req.user.uid]?.amount || d.budget?.amount || 0;
      
      const userPayments = (d.payments || d.expenses || []).filter(e => e.user_id === req.user.uid || !e.user_id || e.user_id === 'legacy_user');
      const userSavings = (d.savings || []).filter(s => s.user_id === req.user.uid || !s.user_id || s.user_id === 'legacy_user');
      
      totalExpenses = userPayments.reduce((s, e) => s + e.amount, 0);
      totalSavings  = userSavings.reduce((s, e) => s + e.amount, 0);
    }
    res.json({
      budget: budgetAmount, totalExpenses, totalSavings,
      amountStillRequired: Math.max(0, budgetAmount - totalSavings),
      availableBalance:    totalSavings - totalExpenses,
      savingsProgress:     budgetAmount > 0 ? (totalSavings  / budgetAmount) * 100 : 0,
      expenseProgress:     budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0,
      isOverBudget:        budgetAmount > 0 ? totalExpenses > budgetAmount : false,
      overBudgetAmount:    Math.max(0, totalExpenses - budgetAmount),
    });
  } catch (e) { 
    console.error("Summary Route Error:", e);
    res.status(500).json({ error: e.message }); 
  }
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
        'INSERT INTO payments (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url]
      );
    } else {
      const d = readJSON();
      const newPay = { id: d._nextPaymentId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', receipt_url, created_at: new Date().toISOString() };
      d.payments.push(newPay);
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



// ═══════════════════════════════════════════════════════════════════════════
// TELEGRAM ACCOUNT LINKING
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/telegram/status', requireAuth, async (req, res) => {
  try {
    let isLinked = false;
    let activeCode = null;
    let telegramId = null;

    if (typeof useLibSQL !== 'undefined' && useLibSQL) {
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/telegram/link-code', requireAuth, async (req, res) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  try {
    if (useLibSQL) {
      await dbRun('DELETE FROM telegram_codes WHERE user_id = ?', [req.user.uid]); // clear old
      await dbRun('INSERT INTO telegram_codes (code, user_id) VALUES (?, ?)', [code, req.user.uid]);
    } else {
      const d = readJSON();
      if (!d.telegram_codes) d.telegram_codes = {};
      // clear old codes for this user
      for (const [k, v] of Object.entries(d.telegram_codes)) {
        if (v === req.user.uid) delete d.telegram_codes[k];
      }
      d.telegram_codes[code] = req.user.uid;
      writeJSON(d);
    }
    res.json({ code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/telegram/set-id', requireAuth, async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId || !String(telegramId).trim()) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }
  const cleanId = String(telegramId).trim();
  try {
    if (typeof useLibSQL !== 'undefined' && useLibSQL) {
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/telegram/disconnect', requireAuth, async (req, res) => {
  try {
    if (typeof useLibSQL !== 'undefined' && useLibSQL) {
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200);

  const msg = req.body.message;
  if (!msg) return;

  const chatId = msg.chat.id.toString();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  async function sendReply(text) {
    if (!botToken) return;
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
      return sendReply("⚠️ Your Telegram account is not linked to FinanceOS.\n\nPlease go to your Dashboard, click 'Connect Telegram' to generate a 6-digit code, and send it here!");
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
      const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileIdToDownload}`);
      const fileData = await fileRes.json();
      const filePath = fileData.result.file_path;

      const fileDataRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
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

    // 5. Save to database using the LINKED user_id!
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || todayDate;
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'Telegram Upload';
    
    if (useLibSQL) {
      await dbRun(
        'INSERT INTO payments (category, description, amount, date, status, receipt_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url, linkedUserId]
      );
    } else {
      const d = readJSON();
      const newPay = { id: d._nextPaymentId++, user_id: linkedUserId, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', receipt_url, created_at: new Date().toISOString() };
      d.payments.push(newPay);
      writeJSON(d);
    }

    sendReply(`✅ Expense logged successfully!\nAmount: ₹${finalAmount}\nCategory: ${finalCat}\nNotes: ${finalDesc}\n\nSaved to your portal as a DRAFT.`);
  } catch (e) {
    console.error("Telegram Webhook error:", e);
    sendReply(`❌ Error processing expense: ${e.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════
app.post(['/api/payments/scan', '/api/expenses/scan'], requireAuth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Image data and mimeType are required.' });
    }
    const imgBuffer = Buffer.from(image, 'base64');
    const ext = mimeType === 'application/pdf' ? '.pdf' : '.jpg';
    const filename = `scan_${Date.now()}${ext}`;
    const fs = require('fs');
    const dir = require('path').join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(require('path').join(dir, filename), imgBuffer);
    const receipt_url = `/uploads/${filename}`;

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

app.get(['/api/payments', '/api/expenses'], requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      return res.json(await dbAll(`
        SELECT p.*, 
               COALESCE(b.category, p.category, 'Miscellaneous') as category,
               COALESCE(p.payment_type, 'Normal') as payment_type
        FROM payments p
        LEFT JOIN bookings b ON p.booking_id = b.id
        WHERE p.user_id = ?
        ORDER BY p.date DESC, p.id DESC
      `, [req.user.uid]));
    }
    const d = readJSON();
    const bkMap = (d.bookings || []).reduce((acc, b) => { acc[b.id] = b; return acc; }, {});
    const items = [...(d.payments || d.expenses || [])]
      .filter(e => e.user_id === req.user.uid || !e.user_id || e.user_id === 'legacy_user')
      .map(e => ({
        ...e,
        category: (e.booking_id && bkMap[e.booking_id]?.category) || e.category || 'Miscellaneous',
        payment_type: e.payment_type || 'Normal'
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(['/api/payments', '/api/expenses'], requireAuth, async (req, res) => {
  const { category, description, amount, date, status, receipt_url, booking_id, payment_type } = req.body;
  const finalStatus = status || 'approved';
  const finalPaymentType = payment_type === 'Advance' ? 'Advance' : 'Normal';
  if (!amount || !date) return res.status(400).json({ error: 'Amount and date required' });
  try {
    let resolvedCategory = category || '';
    if (useLibSQL) {
      if (booking_id && !resolvedCategory) {
        const bk = await dbGet('SELECT category FROM bookings WHERE id = ?', [booking_id]);
        if (bk && bk.category) resolvedCategory = bk.category;
      }
      if (!resolvedCategory) resolvedCategory = 'Miscellaneous';

      const r = await dbRun(
        'INSERT INTO payments (category, description, amount, date, status, receipt_url, user_id, booking_id, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [resolvedCategory, description || '', Number(amount), date, finalStatus, receipt_url || '', req.user.uid, booking_id ? Number(booking_id) : null, finalPaymentType]
      );
      const row = await dbGet('SELECT * FROM payments WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }
    const d = readJSON();
    if (booking_id && !resolvedCategory) {
      const bk = (d.bookings || []).find(b => b.id === Number(booking_id));
      if (bk && bk.category) resolvedCategory = bk.category;
    }
    if (!resolvedCategory) resolvedCategory = 'Miscellaneous';

    const payment = {
      id: d._nextPaymentId++,
      user_id: req.user.uid,
      category: resolvedCategory,
      description: description || '',
      amount: Number(amount),
      date,
      status: finalStatus,
      receipt_url: receipt_url || '',
      booking_id: booking_id ? Number(booking_id) : null,
      payment_type: finalPaymentType,
      created_at: new Date().toISOString()
    };
    d.payments.push(payment);
    writeJSON(d);
    res.status(201).json(payment);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put(['/api/payments/:id', '/api/expenses/:id'], requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { category, description, amount, date, status, receipt_url, booking_id, payment_type } = req.body;
  const finalStatus = status || 'approved';
  const finalPaymentType = payment_type === 'Advance' ? 'Advance' : 'Normal';
  try {
    let resolvedCategory = category || '';
    if (useLibSQL) {
      if (booking_id && !resolvedCategory) {
        const bk = await dbGet('SELECT category FROM bookings WHERE id = ?', [booking_id]);
        if (bk && bk.category) resolvedCategory = bk.category;
      }
      if (!resolvedCategory) {
        const existing = await dbGet('SELECT category FROM payments WHERE id = ?', [id]);
        resolvedCategory = existing?.category || 'Miscellaneous';
      }
      await dbRun('UPDATE payments SET category=?,description=?,amount=?,date=?,status=?,receipt_url=?,booking_id=?,payment_type=? WHERE id=?',
        [resolvedCategory, description || '', Number(amount), date, finalStatus, receipt_url || '', booking_id ? Number(booking_id) : null, finalPaymentType, id]);
      const row = await dbGet('SELECT * FROM payments WHERE id = ?', [id]);
      return res.json(row);
    }
    const d = readJSON(); const idx = d.payments.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (booking_id && !resolvedCategory) {
      const bk = (d.bookings || []).find(b => b.id === Number(booking_id));
      if (bk && bk.category) resolvedCategory = bk.category;
    }
    if (!resolvedCategory) {
      resolvedCategory = d.payments[idx].category || 'Miscellaneous';
    }
    d.payments[idx] = {
      ...d.payments[idx],
      category: resolvedCategory,
      description: description || '',
      amount: Number(amount),
      date,
      status: finalStatus,
      receipt_url: receipt_url || d.payments[idx].receipt_url || '',
      booking_id: booking_id !== undefined ? (booking_id ? Number(booking_id) : null) : d.payments[idx].booking_id,
      payment_type: finalPaymentType
    };
    writeJSON(d); res.json(d.payments[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(['/api/payments/:id/detach', '/api/expenses/:id/detach'], requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (useLibSQL) {
      const p = await dbGet('SELECT p.*, b.category as bk_category FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id WHERE p.id = ?', [id]);
      if (!p) return res.status(404).json({ error: 'Payment not found' });
      const cat = p.category || p.bk_category || 'Miscellaneous';
      await dbRun('UPDATE payments SET booking_id = NULL, category = ? WHERE id = ?', [cat, id]);
      const updated = await dbGet('SELECT * FROM payments WHERE id = ?', [id]);
      return res.json(updated);
    }
    const d = readJSON();
    const idx = d.payments.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });
    const bk = (d.bookings || []).find(b => b.id === Number(d.payments[idx].booking_id));
    d.payments[idx].category = d.payments[idx].category || bk?.category || 'Miscellaneous';
    d.payments[idx].booking_id = null;
    writeJSON(d);
    res.json(d.payments[idx]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete(['/api/payments/:id', '/api/expenses/:id'], requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (useLibSQL) { await dbRun('DELETE FROM payments WHERE id = ?', [id]); return res.json({ success: true }); }
    const d = readJSON(); const idx = d.payments.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.payments.splice(idx, 1); writeJSON(d); res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get(['/api/payments/categories', '/api/expenses/categories'], requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      return res.json(await dbAll(`
        SELECT COALESCE(b.category, p.category, 'Miscellaneous') as category,
               SUM(p.amount) as total,
               COUNT(*) as count
        FROM payments p
        LEFT JOIN bookings b ON p.booking_id = b.id
        WHERE p.user_id = ?
        GROUP BY COALESCE(b.category, p.category, 'Miscellaneous')
        ORDER BY total DESC
      `, [req.user.uid]));
    }
    const d = readJSON();
    const bkMap = (d.bookings || []).reduce((acc, b) => { acc[b.id] = b; return acc; }, {});
    const map = {};
    for (const e of (d.payments || d.expenses || []).filter(e => e.user_id === req.user.uid || !e.user_id || e.user_id === 'legacy_user')) {
      const cat = (e.booking_id && bkMap[e.booking_id]?.category) || e.category || 'Miscellaneous';
      if (!map[cat]) map[cat] = { category: cat, total: 0, count: 0 };
      map[cat].total += e.amount;
      map[cat].count++;
    }
    res.json(Object.values(map).sort((a, b) => b.total - a.total));
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ═══════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/bookings', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      const rows = await dbAll('SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC', [req.user.uid]);
      return res.json(rows);
    }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    res.json([...d.bookings].filter(b => b.user_id === req.user.uid || !b.user_id || b.user_id === 'legacy_user').reverse());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bookings', requireAuth, async (req, res) => {
  const { vendor, service, category, booking_date, event_date, amount, advance, status, notes } = req.body;
  if (!vendor || !service) return res.status(400).json({ error: 'Vendor and service required' });
  const finalCategory = category || 'Miscellaneous';
  try {
    if (useLibSQL) {
      const result = await dbRun(
        'INSERT INTO bookings (user_id, vendor, service, category, booking_date, event_date, amount, advance, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.uid, vendor, service, finalCategory, booking_date || '', event_date || '', Number(amount)||0, Number(advance)||0, status || 'Pending', notes || '']
      );
      const row = await dbGet('SELECT * FROM bookings WHERE id = ?', [Number(result.lastInsertRowid)]);
      return res.status(201).json(row || { id: Number(result.lastInsertRowid), user_id: req.user.uid, vendor, service, category: finalCategory, booking_date, event_date, amount: Number(amount)||0, advance: Number(advance)||0, status: status||'Pending', notes });
    }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const newBooking = {
      id: Date.now(),
      user_id: req.user.uid,
      vendor,
      service,
      category: finalCategory,
      booking_date: booking_date||'',
      event_date: event_date||'',
      amount: Number(amount)||0,
      advance: Number(advance)||0,
      status: status||'Pending',
      notes: notes||''
    };
    d.bookings.push(newBooking);
    writeJSON(d);
    res.json(newBooking);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/bookings/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { vendor, service, category, booking_date, event_date, amount, advance, status, notes } = req.body;
  try {
    if (useLibSQL) {
      await dbRun(
        'UPDATE bookings SET vendor=?, service=?, category=?, booking_date=?, event_date=?, amount=?, advance=?, status=?, notes=? WHERE id=? AND user_id=?',
        [vendor, service, category || 'Miscellaneous', booking_date, event_date, Number(amount)||0, Number(advance)||0, status, notes, id, req.user.uid]
      );
      return res.json({ success: true });
    }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.bookings[idx] = {
      ...d.bookings[idx],
      vendor,
      service,
      category: category || d.bookings[idx].category || 'Miscellaneous',
      booking_date,
      event_date,
      amount: Number(amount)||0,
      advance: Number(advance)||0,
      status,
      notes
    };
    writeJSON(d);
    res.json(d.bookings[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/bookings/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (useLibSQL) { await dbRun('DELETE FROM bookings WHERE id = ?', [id]); return res.json({ success: true }); }
    const d = readJSON();
    if (!d.bookings) d.bookings = [];
    const idx = d.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.bookings.splice(idx, 1);
    writeJSON(d);
    res.json({ success: true });
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
      const rows = await dbAll('SELECT * FROM savings WHERE user_id = ? ORDER BY year DESC, id DESC', [req.user.uid]);
      return res.json(rows);
    }
    const d = readJSON();
    res.json([...d.savings].filter(s => s.user_id === req.user.uid || !s.user_id || s.user_id === 'legacy_user').sort((a, b) => {
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
        'INSERT INTO savings (month, year, amount, note, user_id) VALUES (?, ?, ?, ?, ?)',
        [month, parseInt(year), Number(amount), note || '', req.user.uid]
      );
      const row = await dbGet('SELECT * FROM savings WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }
    const d = readJSON();
    const saving = { id: d._nextSavingsId++, user_id: req.user.uid, month, year: parseInt(year), amount: Number(amount), note: note || '', created_at: new Date().toISOString() };
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

// ═══════════════════════════════════════════════════════════════════════════
// GUESTS API
// ═══════════════════════════════════════════════════════════════════════════

function generateRsvpToken(id) {
  return 'rsvp_' + crypto.randomBytes(8).toString('hex') + (id ? ('_' + id) : '');
}

function drawDiamond(doc, x, y, size = 3, color = '#C59B27') {
  doc.save();
  doc.fillColor(color);
  doc.moveTo(x, y - size)
     .lineTo(x + size, y)
     .lineTo(x, y + size)
     .lineTo(x - size, y)
     .closePath()
     .fill();
  doc.restore();
}

function generateInvitationPDF(guest, baseUrl = 'http://localhost:3000') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A5',
        layout: 'landscape',
        margin: 0,
        info: {
          Title: `Wedding Invitation - ${guest.name}`,
          Author: 'Marriage Manager',
          Subject: 'Wedding Invitation Card'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const width = 595.28;
      const height = 419.53;

      // 1. Background (Soft Pearl / Cream)
      doc.rect(0, 0, width, height).fill('#FCFBF7');

      // 2. Outer Gold Decorative Border
      doc.rect(16, 16, width - 32, height - 32)
         .lineWidth(2.5)
         .strokeColor('#C59B27')
         .stroke();

      // 3. Inner Navy Border
      doc.rect(22, 22, width - 44, height - 44)
         .lineWidth(0.8)
         .strokeColor('#1B3C53')
         .stroke();

      // Corner flourishes
      const corners = [
        [22, 22],
        [width - 22, 22],
        [22, height - 22],
        [width - 22, height - 22]
      ];
      corners.forEach(([cx, cy]) => {
        doc.rect(cx - 3, cy - 3, 6, 6).fill('#C59B27');
      });

      // 4. Top Header Emblem & Title
      doc.fillColor('#C59B27')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('WEDDING CELEBRATION', 0, 42, { align: 'center', width });

      drawDiamond(doc, width / 2 - 85, 47, 3, '#C59B27');
      drawDiamond(doc, width / 2 + 85, 47, 3, '#C59B27');

      doc.fillColor('#71717A')
         .fontSize(9)
         .font('Helvetica')
         .text('Together with their families, cordially invite you to celebrate', 0, 60, { align: 'center', width });

      // 5. Couple / Wedding Headline
      doc.fillColor('#1B3C53')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('The Wedding Celebrations', 0, 80, { align: 'center', width });

      // Gold divider line with central diamond
      doc.moveTo(width / 2 - 80, 110)
         .lineTo(width / 2 + 80, 110)
         .lineWidth(1)
         .strokeColor('#C59B27')
         .stroke();
      drawDiamond(doc, width / 2, 110, 3.5, '#C59B27');

      // 6. Guest Dedication Box
      doc.rect(50, 122, width - 100, 80)
         .fillColor('#FFFFFF')
         .fillOpacity(0.9)
         .fill();
      
      doc.rect(50, 122, width - 100, 80)
         .lineWidth(0.8)
         .strokeColor('#E4E4E7')
         .stroke();

      doc.fillOpacity(1);

      doc.fillColor('#71717A')
         .fontSize(8.5)
         .font('Helvetica-Bold')
         .text('HONORED GUEST', 60, 132, { align: 'center', width: width - 120 });

      doc.fillColor('#1B3C53')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(guest.name, 60, 146, { align: 'center', width: width - 120 });

      // Dependents / Family subtitle
      let depText = '';
      if (Array.isArray(guest.dependents) && guest.dependents.length > 0) {
        const names = guest.dependents.map(d => d.name).filter(Boolean);
        if (names.length > 0) {
          depText = `Accompanied by: ${names.join(', ')}`;
        }
      } else if (guest.plus_one_allowed) {
        depText = `Including Plus-One${guest.plus_one_name ? ` (${guest.plus_one_name})` : ''}`;
      } else if (guest.guest_type === 'Family') {
        depText = 'Invited with Family';
      }

      if (depText) {
        doc.fillColor('#C59B27')
           .fontSize(9.5)
           .font('Helvetica-Bold')
           .text(depText, 60, 172, { align: 'center', width: width - 120 });
      }

      // 7. Assigned Ceremonies & Events
      doc.fillColor('#1B3C53')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('INVITED CEREMONIES & EVENTS', 0, 218, { align: 'center', width });

      const events = Array.isArray(guest.events) && guest.events.length > 0 
        ? guest.events 
        : ['Mehendi', 'Haldi', 'Wedding'];
      
      const eventsStr = events.join('   •   ');
      doc.fillColor('#234C6A')
         .fontSize(10)
         .font('Helvetica')
         .text(eventsStr, 0, 235, { align: 'center', width });

      // 8. RSVP Section Card
      const rsvpBoxY = 265;
      doc.rect(70, rsvpBoxY, width - 140, 75)
         .fillColor('#1B3C53')
         .fill();

      doc.fillColor('#F3E5AB')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('KINDLY CONFIRM ATTENDANCE ONLINE', 70, rsvpBoxY + 12, { align: 'center', width: width - 140 });

      const rsvpUrl = `${baseUrl}/rsvp/${guest.rsvp_token || 'invitation'}`;
      doc.fillColor('#FFFFFF')
         .fontSize(9)
         .font('Helvetica')
         .text(`Scan or visit link to confirm attendance:`, 70, rsvpBoxY + 28, { align: 'center', width: width - 140 });

      doc.fillColor('#FDE047')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(rsvpUrl, 70, rsvpBoxY + 44, { align: 'center', width: width - 140, underline: true });

      const totalHeadcount = guest.expected_attendees || (Number(guest.expected_adults||1) + Number(guest.expected_children||0));
      doc.fillColor('#94A3B8')
         .fontSize(8)
         .font('Helvetica')
         .text(`Expected Attendees: ${totalHeadcount} (${guest.expected_adults || 1} Adults${Number(guest.expected_children) > 0 ? `, ${guest.expected_children} Children` : ''})`, 70, rsvpBoxY + 58, { align: 'center', width: width - 140 });

      // 9. Footer warm closing
      doc.fillColor('#71717A')
         .fontSize(8.5)
         .font('Helvetica-Oblique')
         .text('Your gracious presence and blessings are our greatest gift.', 0, 360, { align: 'center', width });

      doc.fillColor('#C59B27')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Auspicious Moments & Warm Regards', 0, 376, { align: 'center', width });

      drawDiamond(doc, width / 2 - 120, 381, 2.5, '#C59B27');
      drawDiamond(doc, width / 2 + 120, 381, 2.5, '#C59B27');

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

let etherealAccount = null;

async function getUserEmailConfig(userId) {
  let settings = null;
  if (useLibSQL) {
    try {
      const row = await dbGet('SELECT * FROM email_settings WHERE user_id = ?', [userId]);
      if (row) settings = row;
    } catch (e) {
      console.warn('Error reading email_settings from DB:', e.message);
    }
  } else {
    const d = readJSON();
    if (d.email_settings && d.email_settings[userId]) {
      settings = d.email_settings[userId];
    }
  }

  // If user has saved settings:
  if (settings && settings.smtp_user && settings.smtp_pass) {
    return {
      provider: settings.provider || (settings.smtp_user.includes('@gmail.com') ? 'gmail' : 'smtp'),
      smtp_host: settings.smtp_host || 'smtp.gmail.com',
      smtp_port: Number(settings.smtp_port) || 587,
      smtp_secure: Boolean(settings.smtp_secure),
      smtp_user: settings.smtp_user,
      smtp_pass: settings.smtp_pass,
      sender_name: settings.sender_name || 'Wedding Celebrations'
    };
  }

  // Fallback to process.env
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return {
      provider: 'gmail',
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_secure: false,
      smtp_user: process.env.GMAIL_USER,
      smtp_pass: process.env.GMAIL_APP_PASSWORD,
      sender_name: process.env.EMAIL_SENDER_NAME || 'Wedding Celebrations'
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      provider: 'smtp',
      smtp_host: process.env.SMTP_HOST,
      smtp_port: Number(process.env.SMTP_PORT) || 587,
      smtp_secure: Number(process.env.SMTP_PORT) === 465,
      smtp_user: process.env.SMTP_USER,
      smtp_pass: process.env.SMTP_PASS,
      sender_name: process.env.EMAIL_SENDER_NAME || 'Wedding Celebrations'
    };
  }

  return null;
}

async function getEmailTransporter(userId) {
  const config = await getUserEmailConfig(userId);

  if (config) {
    let transporter;
    if (config.provider === 'gmail') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass
        }
      });
    }

    return {
      transporter,
      isConfigured: true,
      config,
      isTest: false
    };
  }

  // Ethereal Test Account (Sandbox fallback when unconfigured)
  if (!etherealAccount) {
    try {
      etherealAccount = await nodemailer.createTestAccount();
    } catch (e) {
      console.warn('Could not create Ethereal account, falling back to JSON mock transport:', e.message);
    }
  }

  if (etherealAccount) {
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass
        }
      }),
      isConfigured: false,
      config: null,
      isTest: true
    };
  } else {
    return {
      transporter: nodemailer.createTransport({ jsonTransport: true }),
      isConfigured: false,
      config: null,
      isTest: true
    };
  }
}

async function sendInvitationEmail({ guest, customSubject, customMessage, baseUrl = 'http://localhost:3000', userId }) {
  if (!guest.email) {
    throw new Error('Guest does not have an email address');
  }

  const { transporter, isConfigured, config, isTest } = await getEmailTransporter(userId || guest.user_id);
  const pdfBuffer = await generateInvitationPDF(guest, baseUrl);

  const subject = customSubject || `Wedding Invitation: You are cordially invited! 💍`;
  const rsvpUrl = `${baseUrl}/rsvp/${guest.rsvp_token}`;
  const confirmUrl = `${rsvpUrl}?action=Confirmed`;
  const maybeUrl = `${rsvpUrl}?action=Maybe`;
  const declineUrl = `${rsvpUrl}?action=Declined`;

  const events = Array.isArray(guest.events) && guest.events.length > 0 
    ? guest.events.join(', ') 
    : 'Mehendi, Haldi, Wedding';

  let familyDetails = '';
  if (Array.isArray(guest.dependents) && guest.dependents.length > 0) {
    const names = guest.dependents.map(d => d.name).filter(Boolean);
    if (names.length) {
      familyDetails = `<p style="margin: 4px 0 16px; color: #4B5563; font-size: 14px;"><strong>Invited Family Members:</strong> ${names.join(', ')}</p>`;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #F3F4F6; }
        .wrapper { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: #1B3C53; padding: 32px 24px; text-align: center; border-bottom: 4px solid #C59B27; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p { color: #F3E5AB; margin: 8px 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 32px 28px; color: #1F2937; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px; }
        .events-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .actions { text-align: center; margin: 28px 0 20px; }
        .btn { display: inline-block; padding: 12px 22px; margin: 6px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 6px; }
        .btn-confirm { background-color: #059669; color: #ffffff !important; }
        .btn-maybe { background-color: #D97706; color: #ffffff !important; }
        .btn-decline { background-color: #DC2626; color: #ffffff !important; }
        .footer { background: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .attachment-note { background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 6px; padding: 12px; font-size: 13px; color: #92400E; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <p>✦ Wedding Invitation ✦</p>
          <h1>The Wedding Celebrations</h1>
        </div>
        <div class="content">
          <div class="greeting">Dear ${guest.name},</div>
          <p>We are filled with immense joy and gratitude to invite you and your family to join us in celebrating our auspicious wedding ceremonies!</p>
          
          ${customMessage ? `<div style="padding: 12px 16px; background: #F0F9FF; border-left: 4px solid #0284C7; font-style: italic; margin: 16px 0;">${customMessage}</div>` : ''}

          <div class="events-card">
            <p style="margin: 0 0 6px; color: #1B3C53; font-weight: bold; font-size: 14px;">Invited Ceremonies & Events:</p>
            <p style="margin: 0; color: #4B5563; font-size: 14px;">✦ ${events}</p>
          </div>

          ${familyDetails}

          <p style="margin-bottom: 8px;"><strong>Kindly confirm your attendance:</strong></p>
          <div class="actions">
            <a href="${confirmUrl}" class="btn btn-confirm">✓ Joyfully Accept</a>
            <a href="${maybeUrl}" class="btn btn-maybe">? Tentative (Maybe)</a>
            <a href="${declineUrl}" class="btn btn-decline">✕ Decline</a>
          </div>

          <div class="attachment-note">
            <strong>💌 Royal Invitation Card Attached:</strong> We have attached your personalized wedding invitation card (PDF) to this email. You can download and keep it for ceremony timings and details.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">With Warm Regards & Best Compliments from the Family</p>
          <p style="margin: 4px 0 0;">Marriage Manager • Wedding Celebrations</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const fromAddress = config 
    ? (config.sender_name ? `"${config.sender_name}" <${config.smtp_user}>` : config.smtp_user)
    : (process.env.EMAIL_FROM || '"Wedding Celebrations" <invitations@weddingmanager.com>');

  const info = await transporter.sendMail({
    from: fromAddress,
    to: guest.email,
    subject,
    html,
    attachments: [
      {
        filename: `Wedding_Invitation_${guest.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });

  const previewUrl = isTest && nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
  if (isTest) {
    console.log(`[Email Sandbox] Ethereal preview generated for ${guest.email}: ${previewUrl}`);
  } else {
    console.log(`[Email Delivered] Real email delivered to ${guest.email} via ${config.smtp_user}. MessageId: ${info.messageId}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    pdfBuffer,
    isTest,
    isConfigured,
    senderEmail: config?.smtp_user || null
  };
}

function formatGuest(g) {
  if (!g) return null;
  const token = g.rsvp_token || generateRsvpToken(g.id);
  return {
    ...g,
    rsvp_token: token,
    invitation_sent_at: g.invitation_sent_at || null,
    rsvp_response_note: g.rsvp_response_note || '',
    stay_preference: g.stay_preference || 'No need of stay',
    tags: typeof g.tags === 'string' ? JSON.parse(g.tags || '[]') : (g.tags || []),
    events: typeof g.events === 'string' ? JSON.parse(g.events || '[]') : (g.events || []),
    dependents: typeof g.dependents === 'string' ? JSON.parse(g.dependents || '[]') : (Array.isArray(g.dependents) ? g.dependents : []),
    plus_one_allowed: Boolean(g.plus_one_allowed),
    check_in_status: Boolean(g.check_in_status),
    expected_adults: Number(g.expected_adults) || 1,
    expected_children: Number(g.expected_children) || 0,
    expected_attendees: Number(g.expected_attendees) || (Number(g.expected_adults) || 1) + (Number(g.expected_children) || 0),
    actual_attendees: Number(g.actual_attendees) || 0
  };
}

// 1. GET /api/guests - list with filtering
app.get('/api/guests', requireAuth, async (req, res) => {
  try {
    const { search, side, relationship_category, rsvp_status, actual_attendance, event, household_name } = req.query;
    let guests = [];

    if (useLibSQL) {
      const rows = await dbAll('SELECT * FROM guests WHERE user_id = ? ORDER BY id DESC', [req.user.uid]);
      guests = rows.map(formatGuest);
    } else {
      const d = readJSON();
      if (!d.guests) d.guests = [];
      guests = d.guests
        .filter(g => g.user_id === req.user.uid || !g.user_id || g.user_id === 'legacy_user')
        .map(formatGuest)
        .reverse();
    }

    // In-memory filters
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      guests = guests.filter(g => 
        (g.name && g.name.toLowerCase().includes(q)) ||
        (g.guest_id && g.guest_id.toLowerCase().includes(q)) ||
        (g.phone && g.phone.toLowerCase().includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        (g.household_name && g.household_name.toLowerCase().includes(q)) ||
        (g.relationship_detail && g.relationship_detail.toLowerCase().includes(q)) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    if (side && side !== 'All') {
      guests = guests.filter(g => g.side === side || (side === 'Both' && (g.side === 'Both' || g.side === 'Bride/Groom')));
    }
    if (relationship_category && relationship_category !== 'All') {
      guests = guests.filter(g => g.relationship_category === relationship_category);
    }
    if (rsvp_status && rsvp_status !== 'All') {
      guests = guests.filter(g => g.rsvp_status === rsvp_status);
    }
    if (actual_attendance && actual_attendance !== 'All') {
      guests = guests.filter(g => g.actual_attendance === actual_attendance);
    }
    if (event && event !== 'All') {
      guests = guests.filter(g => g.events && g.events.includes(event));
    }
    if (household_name) {
      guests = guests.filter(g => g.household_name === household_name);
    }

    res.json(guests);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. GET /api/guests/summary - dashboard metrics & breakdowns
app.get('/api/guests/summary', requireAuth, async (req, res) => {
  try {
    let guests = [];
    if (useLibSQL) {
      const rows = await dbAll('SELECT * FROM guests WHERE user_id = ?', [req.user.uid]);
      guests = rows.map(formatGuest);
    } else {
      const d = readJSON();
      if (!d.guests) d.guests = [];
      guests = d.guests
        .filter(g => g.user_id === req.user.uid || !g.user_id || g.user_id === 'legacy_user')
        .map(formatGuest);
    }

    const totalGuests = guests.length;
    let invited = 0;
    let confirmed = 0;
    let maybe = 0;
    let declined = 0;
    let noResponse = 0;
    let expectedAttendance = 0;
    let actuallyAttended = 0;

    const sideBreakdown = { bride: 0, groom: 0, both: 0 };
    const categoryBreakdown = { family: 0, friend: 0, colleague: 0, other: 0 };
    const foodBreakdown = { veg: 0, nonVeg: 0, jain: 0, vegan: 0, other: 0 };
    const eventBreakdown = { Mehendi: 0, Haldi: 0, Sangeet: 0, Wedding: 0 };

    guests.forEach(g => {
      // RSVP
      const rsvp = (g.rsvp_status === 'Not Responded' || !g.rsvp_status) ? 'Pending Invitation' : g.rsvp_status;
      if (rsvp === 'Confirmed') {
        confirmed++;
        invited++;
        expectedAttendance += Number(g.expected_attendees) || 1;
      } else if (rsvp === 'Maybe') {
        maybe++;
        invited++;
        expectedAttendance += Number(g.expected_attendees) || 1;
      } else if (rsvp === 'Declined') {
        declined++;
        invited++;
      } else if (rsvp === 'Invited') {
        invited++;
      } else {
        noResponse++;
      }

      // Actual attendance
      if (g.actual_attendance === 'Attended' || g.check_in_status) {
        actuallyAttended += Number(g.actual_attendees) || Number(g.expected_attendees) || 1;
      }

      // Side
      const s = (g.side || '').toLowerCase();
      if (s.includes('bride')) sideBreakdown.bride++;
      else if (s.includes('groom')) sideBreakdown.groom++;
      else sideBreakdown.both++;

      // Category
      const cat = (g.relationship_category || '').toLowerCase();
      if (cat.includes('fam')) categoryBreakdown.family++;
      else if (cat.includes('friend')) categoryBreakdown.friend++;
      else if (cat.includes('colleague') || cat.includes('office') || cat.includes('work')) categoryBreakdown.colleague++;
      else categoryBreakdown.other++;

      // Food
      const food = (g.food_preference || '').toLowerCase();
      if (food.includes('non')) foodBreakdown.nonVeg++;
      else if (food.includes('jain')) foodBreakdown.jain++;
      else if (food.includes('vegan')) foodBreakdown.vegan++;
      else if (food.includes('veg')) foodBreakdown.veg++;
      else foodBreakdown.other++;

      // Events
      if (Array.isArray(g.events)) {
        g.events.forEach(ev => {
          if (eventBreakdown[ev] !== undefined) {
            eventBreakdown[ev]++;
          }
        });
      }
    });

    res.json({
      totalGuests,
      invited,
      confirmed,
      maybe,
      declined,
      noResponse,
      expectedAttendance,
      actuallyAttended,
      sideBreakdown,
      categoryBreakdown,
      foodBreakdown,
      eventBreakdown
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. POST /api/guests - create guest
app.post('/api/guests', requireAuth, async (req, res) => {
  const {
    name, phone, email, gender, age_group, side,
    relationship_category, relationship_detail, guest_type,
    household_name, household_role, plus_one_allowed, plus_one_name,
    rsvp_status, expected_adults, expected_children, expected_attendees,
    actual_attendance, actual_attendees, check_in_status,
    food_preference, special_requirements, notes, tags, events, dependents,
    stay_preference
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Guest name is required' });
  }

  const expAdults = Number(expected_adults) !== undefined && !isNaN(Number(expected_adults)) ? Number(expected_adults) : 1;
  const expChildren = Number(expected_children) || 0;
  const expTotal = Number(expected_attendees) || (expAdults + expChildren);
  const actAttendees = Number(actual_attendees) || 0;
  const tagsJSON = JSON.stringify(Array.isArray(tags) ? tags : []);
  const eventsJSON = JSON.stringify(Array.isArray(events) && events.length ? events : ['Mehendi', 'Haldi', 'Wedding']);
  const dependentsJSON = JSON.stringify(Array.isArray(dependents) ? dependents : []);
  const checkIn = check_in_status ? 1 : 0;
  const checkInTime = checkIn ? new Date().toISOString() : null;
  const stayPref = stay_preference || 'No need of stay';

  try {
    if (useLibSQL) {
      const countRow = await dbGet('SELECT COUNT(*) as count FROM guests');
      const nextNum = (countRow?.count || 0) + 1001;
      const guestId = `GST-${nextNum}`;

      const result = await dbRun(`
        INSERT INTO guests (
          guest_id, user_id, name, phone, email, gender, age_group, side,
          relationship_category, relationship_detail, guest_type,
          household_name, household_role, plus_one_allowed, plus_one_name,
          rsvp_status, expected_adults, expected_children, expected_attendees,
          actual_attendance, actual_attendees, check_in_status, check_in_time,
          food_preference, special_requirements, notes, tags, events, dependents,
          stay_preference, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        guestId, req.user.uid, name.trim(), phone || '', email || '', gender || '', age_group || 'Adult',
        side || 'Bride', relationship_category || 'Family', relationship_detail || '', guest_type || 'Individual',
        household_name || '', household_role || 'Primary', plus_one_allowed ? 1 : 0, plus_one_name || '',
        rsvp_status || 'Pending Invitation', expAdults, expChildren, expTotal,
        actual_attendance || 'Pending', actAttendees, checkIn, checkInTime,
        food_preference || 'Vegetarian', special_requirements || '', notes || '',
        tagsJSON, eventsJSON, dependentsJSON, stayPref
      ]);

      const inserted = await dbGet('SELECT * FROM guests WHERE id = ?', [Number(result.lastInsertRowid)]);
      return res.status(201).json(formatGuest(inserted));
    }

    const d = readJSON();
    if (!d.guests) d.guests = [];
    const nextNum = d._nextGuestId ? d._nextGuestId++ : (d.guests.length + 1001);
    const guestId = `GST-${nextNum}`;
    const newId = Date.now();

    const newGuest = {
      id: newId,
      guest_id: guestId,
      user_id: req.user.uid,
      name: name.trim(),
      phone: phone || '',
      email: email || '',
      gender: gender || '',
      age_group: age_group || 'Adult',
      side: side || 'Bride',
      relationship_category: relationship_category || 'Family',
      relationship_detail: relationship_detail || '',
      guest_type: guest_type || 'Individual',
      household_name: household_name || '',
      household_role: household_role || 'Primary',
      plus_one_allowed: Boolean(plus_one_allowed),
      plus_one_name: plus_one_name || '',
      rsvp_status: rsvp_status || 'Pending Invitation',
      rsvp_token: generateRsvpToken(newId),
      stay_preference: stayPref,
      expected_adults: expAdults,
      expected_children: expChildren,
      expected_attendees: expTotal,
      actual_attendance: actual_attendance || 'Pending',
      actual_attendees: actAttendees,
      check_in_status: Boolean(checkIn),
      check_in_time: checkInTime,
      food_preference: food_preference || 'Vegetarian',
      special_requirements: special_requirements || '',
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : [],
      events: Array.isArray(events) && events.length ? events : ['Mehendi', 'Haldi', 'Wedding'],
      dependents: Array.isArray(dependents) ? dependents : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    d.guests.push(newGuest);
    writeJSON(d);
    res.status(201).json(formatGuest(newGuest));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. PUT /api/guests/:id - update guest
app.put('/api/guests/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    name, phone, email, gender, age_group, side,
    relationship_category, relationship_detail, guest_type,
    household_name, household_role, plus_one_allowed, plus_one_name,
    rsvp_status, expected_adults, expected_children, expected_attendees,
    actual_attendance, actual_attendees, check_in_status,
    food_preference, special_requirements, notes, tags, events, dependents,
    stay_preference
  } = req.body;

  const expAdults = Number(expected_adults) !== undefined && !isNaN(Number(expected_adults)) ? Number(expected_adults) : 1;
  const expChildren = Number(expected_children) || 0;
  const expTotal = Number(expected_attendees) || (expAdults + expChildren);
  const actAttendees = Number(actual_attendees) || 0;
  const tagsJSON = JSON.stringify(Array.isArray(tags) ? tags : []);
  const eventsJSON = JSON.stringify(Array.isArray(events) ? events : []);
  const dependentsJSON = JSON.stringify(Array.isArray(dependents) ? dependents : []);
  const checkIn = check_in_status ? 1 : 0;
  const checkInTime = checkIn ? (req.body.check_in_time || new Date().toISOString()) : null;

  try {
    if (useLibSQL) {
      await dbRun(`
        UPDATE guests SET
          name = ?, phone = ?, email = ?, gender = ?, age_group = ?, side = ?,
          relationship_category = ?, relationship_detail = ?, guest_type = ?,
          household_name = ?, household_role = ?, plus_one_allowed = ?, plus_one_name = ?,
          rsvp_status = ?, expected_adults = ?, expected_children = ?, expected_attendees = ?,
          actual_attendance = ?, actual_attendees = ?, check_in_status = ?, check_in_time = ?,
          food_preference = ?, special_requirements = ?, notes = ?, tags = ?, events = ?, dependents = ?,
          stay_preference = COALESCE(?, stay_preference),
          updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `, [
        name, phone || '', email || '', gender || '', age_group || 'Adult', side || 'Bride',
        relationship_category || 'Family', relationship_detail || '', guest_type || 'Individual',
        household_name || '', household_role || 'Primary', plus_one_allowed ? 1 : 0, plus_one_name || '',
        rsvp_status || 'Pending Invitation', expAdults, expChildren, expTotal,
        actual_attendance || 'Pending', actAttendees, checkIn, checkInTime,
        food_preference || 'Vegetarian', special_requirements || '', notes || '',
        tagsJSON, eventsJSON, dependentsJSON, stay_preference !== undefined ? stay_preference : null,
        id, req.user.uid
      ]);

      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      if (!updated) return res.status(404).json({ error: 'Guest not found' });
      return res.json(formatGuest(updated));
    }

    const d = readJSON();
    if (!d.guests) d.guests = [];
    const idx = d.guests.findIndex(g => g.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Guest not found' });

    d.guests[idx] = {
      ...d.guests[idx],
      name: name !== undefined ? name : d.guests[idx].name,
      phone: phone !== undefined ? phone : d.guests[idx].phone,
      email: email !== undefined ? email : d.guests[idx].email,
      gender: gender !== undefined ? gender : d.guests[idx].gender,
      age_group: age_group !== undefined ? age_group : d.guests[idx].age_group,
      side: side !== undefined ? side : d.guests[idx].side,
      relationship_category: relationship_category !== undefined ? relationship_category : d.guests[idx].relationship_category,
      relationship_detail: relationship_detail !== undefined ? relationship_detail : d.guests[idx].relationship_detail,
      guest_type: guest_type !== undefined ? guest_type : d.guests[idx].guest_type,
      household_name: household_name !== undefined ? household_name : d.guests[idx].household_name,
      household_role: household_role !== undefined ? household_role : d.guests[idx].household_role,
      plus_one_allowed: plus_one_allowed !== undefined ? Boolean(plus_one_allowed) : d.guests[idx].plus_one_allowed,
      plus_one_name: plus_one_name !== undefined ? plus_one_name : d.guests[idx].plus_one_name,
      rsvp_status: rsvp_status !== undefined ? rsvp_status : d.guests[idx].rsvp_status,
      stay_preference: stay_preference !== undefined ? stay_preference : (d.guests[idx].stay_preference || 'No need of stay'),
      expected_adults: expAdults,
      expected_children: expChildren,
      expected_attendees: expTotal,
      actual_attendance: actual_attendance !== undefined ? actual_attendance : d.guests[idx].actual_attendance,
      actual_attendees: actAttendees,
      check_in_status: Boolean(checkIn),
      check_in_time: checkInTime,
      food_preference: food_preference !== undefined ? food_preference : d.guests[idx].food_preference,
      special_requirements: special_requirements !== undefined ? special_requirements : d.guests[idx].special_requirements,
      notes: notes !== undefined ? notes : d.guests[idx].notes,
      tags: Array.isArray(tags) ? tags : d.guests[idx].tags,
      events: Array.isArray(events) ? events : d.guests[idx].events,
      dependents: Array.isArray(dependents) ? dependents : (d.guests[idx].dependents || []),
      updated_at: new Date().toISOString()
    };

    writeJSON(d);
    res.json(formatGuest(d.guests[idx]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. DELETE /api/guests/:id
app.delete('/api/guests/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (useLibSQL) {
      await dbRun('DELETE FROM guests WHERE id = ? AND user_id = ?', [id, req.user.uid]);
      return res.json({ success: true });
    }
    const d = readJSON();
    if (!d.guests) d.guests = [];
    const idx = d.guests.findIndex(g => g.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Guest not found' });
    d.guests.splice(idx, 1);
    writeJSON(d);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 6. POST /api/guests/bulk - bulk operations
app.post('/api/guests/bulk', requireAuth, async (req, res) => {
  const { action, guestIds, data } = req.body;
  if (!action || !Array.isArray(guestIds) || guestIds.length === 0) {
    return res.status(400).json({ error: 'Invalid bulk action payload' });
  }

  try {
    if (useLibSQL) {
      for (const id of guestIds) {
        if (action === 'delete') {
          await dbRun('DELETE FROM guests WHERE id = ? AND user_id = ?', [id, req.user.uid]);
        } else if (action === 'change_rsvp') {
          await dbRun('UPDATE guests SET rsvp_status = ?, updated_at = datetime("now") WHERE id = ? AND user_id = ?', [data.rsvp_status, id, req.user.uid]);
        } else if (action === 'change_stay') {
          await dbRun('UPDATE guests SET stay_preference = ?, updated_at = datetime("now") WHERE id = ? AND user_id = ?', [data.stay_preference, id, req.user.uid]);
        } else if (action === 'mark_attendance') {
          const isAttended = data.actual_attendance === 'Attended';
          await dbRun(`
            UPDATE guests SET 
              actual_attendance = ?, 
              check_in_status = ?, 
              check_in_time = ?,
              actual_attendees = CASE WHEN ? = 1 AND (actual_attendees IS NULL OR actual_attendees = 0) THEN expected_attendees ELSE actual_attendees END,
              updated_at = datetime('now')
            WHERE id = ? AND user_id = ?
          `, [data.actual_attendance, isAttended ? 1 : 0, isAttended ? new Date().toISOString() : null, isAttended ? 1 : 0, id, req.user.uid]);
        }
      }
      return res.json({ success: true, count: guestIds.length });
    }

    const d = readJSON();
    if (!d.guests) d.guests = [];

    if (action === 'delete') {
      const set = new Set(guestIds.map(Number));
      d.guests = d.guests.filter(g => !set.has(Number(g.id)));
    } else {
      d.guests.forEach(g => {
        if (guestIds.map(Number).includes(Number(g.id))) {
          if (action === 'change_rsvp') {
            g.rsvp_status = data.rsvp_status;
          } else if (action === 'change_stay') {
            g.stay_preference = data.stay_preference;
          } else if (action === 'mark_attendance') {
            g.actual_attendance = data.actual_attendance;
            const isAttended = data.actual_attendance === 'Attended';
            g.check_in_status = isAttended;
            g.check_in_time = isAttended ? new Date().toISOString() : null;
            if (isAttended && (!g.actual_attendees || g.actual_attendees === 0)) {
              g.actual_attendees = g.expected_attendees || 1;
            }
          } else if (action === 'assign_event') {
            const evs = new Set(Array.isArray(g.events) ? g.events : []);
            evs.add(data.event);
            g.events = Array.from(evs);
          } else if (action === 'remove_event') {
            g.events = (Array.isArray(g.events) ? g.events : []).filter(e => e !== data.event);
          } else if (action === 'add_tag') {
            const tgs = new Set(Array.isArray(g.tags) ? g.tags : []);
            tgs.add(data.tag);
            g.tags = Array.from(tgs);
          }
          g.updated_at = new Date().toISOString();
        }
      });
    }

    writeJSON(d);
    res.json({ success: true, count: guestIds.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 7. POST /api/guests/import - bulk import
app.post('/api/guests/import', requireAuth, async (req, res) => {
  const { guests } = req.body;
  if (!Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({ error: 'No guests data provided' });
  }

  try {
    const imported = [];
    const d = readJSON();
    if (!d.guests) d.guests = [];

    for (const raw of guests) {
      if (!raw.name || !raw.name.trim()) continue;
      const nextNum = d._nextGuestId ? d._nextGuestId++ : (d.guests.length + 1001);
      const guestId = raw.guest_id || `GST-${nextNum}`;
      const expAdults = Number(raw.expected_adults) || 1;
      const expChildren = Number(raw.expected_children) || 0;
      const expTotal = Number(raw.expected_attendees) || (expAdults + expChildren);

      const guestItem = {
        id: Date.now() + Math.floor(Math.random() * 100000),
        guest_id: guestId,
        user_id: req.user.uid,
        name: raw.name.trim(),
        phone: raw.phone || '',
        email: raw.email || '',
        gender: raw.gender || '',
        age_group: raw.age_group || 'Adult',
        side: raw.side || 'Bride',
        relationship_category: raw.relationship_category || 'Family',
        relationship_detail: raw.relationship_detail || '',
        guest_type: raw.guest_type || 'Individual',
        household_name: raw.household_name || '',
        household_role: raw.household_role || 'Primary',
        plus_one_allowed: Boolean(raw.plus_one_allowed),
        plus_one_name: raw.plus_one_name || '',
        rsvp_status: (raw.rsvp_status === 'Not Responded' || !raw.rsvp_status) ? 'Pending Invitation' : raw.rsvp_status,
        stay_preference: raw.stay_preference || 'No need of stay',
        expected_adults: expAdults,
        expected_children: expChildren,
        expected_attendees: expTotal,
        actual_attendance: raw.actual_attendance || 'Pending',
        actual_attendees: Number(raw.actual_attendees) || 0,
        check_in_status: Boolean(raw.check_in_status),
        check_in_time: raw.check_in_time || null,
        food_preference: raw.food_preference || 'Vegetarian',
        special_requirements: raw.special_requirements || '',
        notes: raw.notes || '',
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        events: Array.isArray(raw.events) && raw.events.length ? raw.events : ['Mehendi', 'Haldi', 'Wedding'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (useLibSQL) {
        await dbRun(`
          INSERT INTO guests (
            guest_id, user_id, name, phone, email, gender, age_group, side,
            relationship_category, relationship_detail, guest_type,
            household_name, household_role, plus_one_allowed, plus_one_name,
            rsvp_status, expected_adults, expected_children, expected_attendees,
            actual_attendance, actual_attendees, check_in_status, check_in_time,
            food_preference, special_requirements, notes, tags, events, stay_preference, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          guestItem.guest_id, req.user.uid, guestItem.name, guestItem.phone, guestItem.email, guestItem.gender, guestItem.age_group,
          guestItem.side, guestItem.relationship_category, guestItem.relationship_detail, guestItem.guest_type,
          guestItem.household_name, guestItem.household_role, guestItem.plus_one_allowed ? 1 : 0, guestItem.plus_one_name,
          guestItem.rsvp_status, guestItem.expected_adults, guestItem.expected_children, guestItem.expected_attendees,
          guestItem.actual_attendance, guestItem.actual_attendees, guestItem.check_in_status ? 1 : 0, guestItem.check_in_time,
          guestItem.food_preference, guestItem.special_requirements, guestItem.notes,
          JSON.stringify(guestItem.tags), JSON.stringify(guestItem.events), guestItem.stay_preference
        ]);
      } else {
        d.guests.push(guestItem);
      }
      imported.push(formatGuest(guestItem));
    }

    if (!useLibSQL) {
      writeJSON(d);
    }

    res.status(201).json({ success: true, importedCount: imported.length, guests: imported });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL DELIVERY CONFIGURATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/email/settings - Check current email delivery status
app.get('/api/email/settings', requireAuth, async (req, res) => {
  try {
    const config = await getUserEmailConfig(req.user.uid);
    if (!config) {
      return res.json({
        configured: false,
        provider: 'gmail',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user: '',
        sender_name: '',
        hasPassword: false
      });
    }

    res.json({
      configured: true,
      provider: config.provider,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_secure: config.smtp_secure,
      smtp_user: config.smtp_user,
      sender_name: config.sender_name,
      hasPassword: Boolean(config.smtp_pass)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email/settings - Verify and save SMTP / Gmail settings
app.post('/api/email/settings', requireAuth, async (req, res) => {
  try {
    const { provider, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, sender_name } = req.body || {};
    if (!smtp_user || !String(smtp_user).trim()) {
      return res.status(400).json({ error: 'Email / Username is required' });
    }

    const cleanUser = String(smtp_user).trim();
    const existing = await getUserEmailConfig(req.user.uid);
    const passToUse = (smtp_pass && String(smtp_pass).trim()) ? String(smtp_pass).trim() : (existing ? existing.smtp_pass : '');

    if (!passToUse) {
      return res.status(400).json({ error: 'Password or Google App Password is required' });
    }

    const providerToUse = provider || (cleanUser.includes('@gmail.com') ? 'gmail' : 'smtp');
    const hostToUse = (smtp_host && String(smtp_host).trim()) ? String(smtp_host).trim() : 'smtp.gmail.com';
    const portToUse = Number(smtp_port) || (providerToUse === 'gmail' ? 587 : 587);
    const secureToUse = Boolean(smtp_secure) || portToUse === 465;
    const senderNameToUse = sender_name && String(sender_name).trim() ? String(sender_name).trim() : 'Wedding Celebrations';

    // Verify SMTP connection before saving
    let testTransporter;
    if (providerToUse === 'gmail') {
      testTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: cleanUser, pass: passToUse }
      });
    } else {
      testTransporter = nodemailer.createTransport({
        host: hostToUse,
        port: portToUse,
        secure: secureToUse,
        auth: { user: cleanUser, pass: passToUse }
      });
    }

    try {
      await testTransporter.verify();
    } catch (verifyErr) {
      console.error('SMTP verify error:', verifyErr.message);
      let errorHint = verifyErr.message;
      if (providerToUse === 'gmail' && (errorHint.includes('Invalid login') || errorHint.includes('535') || errorHint.includes('Username and Password not accepted'))) {
        errorHint = 'Google rejected the login. Please use a 16-character Google App Password (not your normal Gmail login password). You can generate one at myaccount.google.com/apppasswords.';
      }
      return res.status(400).json({ error: `Connection verification failed: ${errorHint}` });
    }

    // Save to Database / JSON
    if (useLibSQL) {
      await dbRun(`
        INSERT INTO email_settings (user_id, provider, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, sender_name, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          provider = excluded.provider,
          smtp_host = excluded.smtp_host,
          smtp_port = excluded.smtp_port,
          smtp_secure = excluded.smtp_secure,
          smtp_user = excluded.smtp_user,
          smtp_pass = excluded.smtp_pass,
          sender_name = excluded.sender_name,
          updated_at = datetime('now')
      `, [req.user.uid, providerToUse, hostToUse, portToUse, secureToUse ? 1 : 0, cleanUser, passToUse, senderNameToUse]);
    } else {
      const d = readJSON();
      if (!d.email_settings) d.email_settings = {};
      d.email_settings[req.user.uid] = {
        provider: providerToUse,
        smtp_host: hostToUse,
        smtp_port: portToUse,
        smtp_secure: secureToUse,
        smtp_user: cleanUser,
        smtp_pass: passToUse,
        sender_name: senderNameToUse,
        updated_at: new Date().toISOString()
      };
      writeJSON(d);
    }

    console.log(`[Email Settings] Connected email delivery for ${req.user.uid} (${cleanUser})`);
    res.json({
      success: true,
      message: 'Email delivery credentials verified and saved successfully!',
      configured: true,
      sender_email: cleanUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email/test - Send a real test verification email
app.post('/api/email/test', requireAuth, async (req, res) => {
  try {
    const { toEmail } = req.body || {};
    const recipient = (toEmail && String(toEmail).trim()) ? String(toEmail).trim() : req.user.email;
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email address is required for test email.' });
    }

    const { transporter, isConfigured, config } = await getEmailTransporter(req.user.uid);
    if (!isConfigured || !config) {
      return res.status(400).json({ error: 'Please configure and save your email credentials first before sending a test.' });
    }

    const fromAddress = config.sender_name 
      ? `"${config.sender_name}" <${config.smtp_user}>` 
      : config.smtp_user;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: '💍 Test Email: Wedding Invitation Delivery Verified!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 20px auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
          <div style="text-align: center; border-bottom: 2px solid #C59B27; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #1B3C53; margin: 0; font-size: 22px;">Wedding Expense Manager</h2>
            <p style="color: #C59B27; font-weight: bold; margin: 6px 0 0; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Email Delivery Verification</p>
          </div>
          <p style="color: #1F2937; font-size: 15px; line-height: 1.6;">
            Hello! This is a test email confirming that your wedding invitation email delivery has been <strong>successfully configured and verified</strong>.
          </p>
          <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 14px; margin: 18px 0; color: #065F46; font-size: 14px; line-height: 1.6;">
            ✓ <strong>Connected Sender:</strong> ${config.smtp_user}<br>
            ✓ <strong>Recipient:</strong> ${recipient}<br>
            ✓ <strong>Delivery Status:</strong> Live & Active
          </div>
          <p style="color: #4B5563; font-size: 14px; line-height: 1.5;">
            When you send invitations to your wedding guests, they will now be delivered directly to their real inbox with their personalized Royal Wedding Invitation Card (PDF) attached!
          </p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF; text-align: center;">
            Sent automatically by Marriage Expense Manager
          </div>
        </div>
      `
    });

    console.log(`[Email Test] Test email delivered to ${recipient}. MessageId: ${info.messageId}`);
    res.json({
      success: true,
      message: `Test email successfully delivered to ${recipient}! Check your inbox.`,
      messageId: info.messageId
    });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: `Failed to send test email: ${err.message}` });
  }
});

// POST /api/email/settings/disconnect - Revert to unconfigured/sandbox mode
app.post('/api/email/settings/disconnect', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) {
      await dbRun('DELETE FROM email_settings WHERE user_id = ?', [req.user.uid]);
    } else {
      const d = readJSON();
      if (d.email_settings) {
        delete d.email_settings[req.user.uid];
        writeJSON(d);
      }
    }
    res.json({ success: true, message: 'Email settings disconnected. Reverted to default.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/guests/:id/send-invitation - Send wedding invitation email with attached PDF card
app.post('/api/guests/:id/send-invitation', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { email, customSubject, customMessage } = req.body || {};

  try {
    let guest;
    if (useLibSQL) {
      const row = await dbGet('SELECT * FROM guests WHERE id = ? AND user_id = ?', [id, req.user.uid]);
      if (!row) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(row);
    } else {
      const d = readJSON();
      const item = (d.guests || []).find(g => g.id === id);
      if (!item) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(item);
    }

    const recipientEmail = (email || guest.email || '').trim();
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email address is required to send an invitation.' });
    }

    // Ensure token is persisted
    const token = guest.rsvp_token || generateRsvpToken(guest.id);
    guest.rsvp_token = token;
    guest.email = recipientEmail;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const mailResult = await sendInvitationEmail({
      guest,
      customSubject,
      customMessage,
      baseUrl,
      userId: req.user.uid
    });

    const now = new Date().toISOString();
    if (useLibSQL) {
      await dbRun(`
        UPDATE guests SET
          email = ?,
          rsvp_token = ?,
          rsvp_status = 'Invited',
          invitation_sent_at = ?,
          updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `, [recipientEmail, token, now, id, req.user.uid]);
      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => g.id === id);
      if (idx !== -1) {
        d.guests[idx].email = recipientEmail;
        d.guests[idx].rsvp_token = token;
        d.guests[idx].rsvp_status = 'Invited';
        d.guests[idx].invitation_sent_at = now;
        d.guests[idx].updated_at = now;
        writeJSON(d);
        guest = formatGuest(d.guests[idx]);
      }
    }

    res.json({
      success: true,
      message: mailResult.isConfigured
        ? `Invitation email delivered successfully to ${recipientEmail}`
        : `Invitation preview generated (Sandbox Mode). Real email delivery is not configured yet.`,
      previewUrl: mailResult.previewUrl,
      pdfUrl: `/api/guests/${id}/invitation-pdf`,
      isTest: mailResult.isTest,
      isConfigured: mailResult.isConfigured,
      warning: mailResult.isTest
        ? 'Real email delivery not configured yet. Configure Email Delivery Settings in Guests to deliver to real recipient inboxes.'
        : null,
      guest
    });
  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ error: err.message || 'Failed to send invitation' });
  }
});

// 9. POST /api/guests/send-bulk-invitations - Batch send invitations
app.post('/api/guests/send-bulk-invitations', requireAuth, async (req, res) => {
  const { guestIds, customSubject, customMessage } = req.body || {};
  if (!Array.isArray(guestIds) || guestIds.length === 0) {
    return res.status(400).json({ error: 'No guests selected for invitation dispatch.' });
  }

  try {
    let allGuests = [];
    if (useLibSQL) {
      const rows = await dbAll('SELECT * FROM guests WHERE user_id = ?', [req.user.uid]);
      allGuests = rows.map(formatGuest);
    } else {
      const d = readJSON();
      allGuests = (d.guests || []).map(formatGuest);
    }

    const targetGuests = allGuests.filter(g => guestIds.includes(g.id));
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let sentCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const g of targetGuests) {
      if (!g.email || !g.email.trim()) {
        skippedCount++;
        continue;
      }
      try {
        const token = g.rsvp_token || generateRsvpToken(g.id);
        g.rsvp_token = token;
        await sendInvitationEmail({
          guest: g,
          customSubject,
          customMessage,
          baseUrl,
          userId: req.user.uid
        });

        const now = new Date().toISOString();
        if (useLibSQL) {
          await dbRun(`
            UPDATE guests SET
              rsvp_token = ?,
              rsvp_status = 'Invited',
              invitation_sent_at = ?,
              updated_at = datetime('now')
            WHERE id = ? AND user_id = ?
          `, [token, now, g.id, req.user.uid]);
        } else {
          const d = readJSON();
          const idx = (d.guests || []).findIndex(item => item.id === g.id);
          if (idx !== -1) {
            d.guests[idx].rsvp_token = token;
            d.guests[idx].rsvp_status = 'Invited';
            d.guests[idx].invitation_sent_at = now;
            d.guests[idx].updated_at = now;
            writeJSON(d);
          }
        }
        sentCount++;
      } catch (err) {
        errors.push({ id: g.id, name: g.name, error: err.message });
      }
    }

    const emailConfig = await getUserEmailConfig(req.user.uid);

    res.json({
      success: true,
      sentCount,
      skippedCount,
      isConfigured: Boolean(emailConfig),
      warning: !emailConfig
        ? 'Real email delivery not configured yet. Bulk invitations were simulated in test mode. Please configure Email Settings in Guests.'
        : null,
      errors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /api/guests/:id/invitation-pdf - Download / Stream invitation PDF card
app.get('/api/guests/:id/invitation-pdf', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    let guest;
    if (useLibSQL) {
      const row = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      if (!row) return res.status(404).send('Guest not found');
      guest = formatGuest(row);
    } else {
      const d = readJSON();
      const item = (d.guests || []).find(g => g.id === id);
      if (!item) return res.status(404).send('Guest not found');
      guest = formatGuest(item);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfBuffer = await generateInvitationPDF(guest, baseUrl);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Wedding_Invitation_${guest.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).send('Error generating invitation PDF: ' + err.message);
  }
});

// 11. PATCH /api/guests/:id/rsvp - Quick manual RSVP status update
app.patch('/api/guests/:id/rsvp', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { rsvp_status } = req.body;
  if (!rsvp_status) return res.status(400).json({ error: 'rsvp_status is required' });

  try {
    let guest;
    if (useLibSQL) {
      await dbRun(`
        UPDATE guests SET
          rsvp_status = ?,
          updated_at = datetime('now')
        WHERE id = ? AND (user_id = ? OR user_id = 'legacy_user' OR user_id IS NULL OR user_id = '')
      `, [rsvp_status, id, req.user.uid]);
      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      if (!updated) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => Number(g.id) === Number(id));
      if (idx === -1) return res.status(404).json({ error: 'Guest not found' });
      d.guests[idx].rsvp_status = rsvp_status;
      d.guests[idx].updated_at = new Date().toISOString();
      writeJSON(d);
      guest = formatGuest(d.guests[idx]);
    }

    res.json({ success: true, guest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11b. PATCH /api/guests/:id/stay - Quick stay preference update
app.patch('/api/guests/:id/stay', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { stay_preference } = req.body;
  if (!stay_preference) return res.status(400).json({ error: 'stay_preference is required' });

  try {
    let guest;
    if (useLibSQL) {
      await dbRun(`
        UPDATE guests SET
          stay_preference = ?,
          updated_at = datetime('now')
        WHERE id = ? AND (user_id = ? OR user_id = 'legacy_user' OR user_id IS NULL OR user_id = '')
      `, [stay_preference, id, req.user.uid]);
      const updated = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
      if (!updated) return res.status(404).json({ error: 'Guest not found' });
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => Number(g.id) === Number(id));
      if (idx === -1) return res.status(404).json({ error: 'Guest not found' });
      d.guests[idx].stay_preference = stay_preference;
      d.guests[idx].updated_at = new Date().toISOString();
      writeJSON(d);
      guest = formatGuest(d.guests[idx]);
    }

    res.json({ success: true, guest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. GET /api/public/rsvp/:token - Public endpoint to retrieve guest invitation details
app.get('/api/public/rsvp/:token', async (req, res) => {
  const { token } = req.params;
  try {
    let guest = null;
    if (useLibSQL) {
      const row = await dbGet('SELECT * FROM guests WHERE rsvp_token = ?', [token]);
      if (row) guest = formatGuest(row);
    } else {
      const d = readJSON();
      const item = (d.guests || []).find(g => g.rsvp_token === token);
      if (item) guest = formatGuest(item);
    }

    if (!guest) {
      return res.status(404).json({ error: 'Invitation not found or link has expired.' });
    }

    res.json({
      id: guest.id,
      name: guest.name,
      guest_type: guest.guest_type,
      dependents: guest.dependents,
      events: guest.events,
      expected_adults: guest.expected_adults,
      expected_children: guest.expected_children,
      expected_attendees: guest.expected_attendees,
      rsvp_status: guest.rsvp_status,
      rsvp_response_note: guest.rsvp_response_note,
      invitation_sent_at: guest.invitation_sent_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. POST /api/public/rsvp/:token - Public endpoint for guests to submit RSVP response
app.post('/api/public/rsvp/:token', async (req, res) => {
  const { token } = req.params;
  const { rsvp_status, expected_adults, expected_children, expected_attendees, rsvp_response_note, stay_preference } = req.body || {};

  if (!rsvp_status || !['Confirmed', 'Maybe', 'Declined'].includes(rsvp_status)) {
    return res.status(400).json({ error: 'Valid rsvp_status (Confirmed, Maybe, Declined) is required.' });
  }

  try {
    let guest = null;
    if (useLibSQL) {
      const row = await dbGet('SELECT * FROM guests WHERE rsvp_token = ?', [token]);
      if (!row) return res.status(404).json({ error: 'Invitation not found.' });

      const a = expected_adults !== undefined ? Number(expected_adults) : (row.expected_adults || 1);
      const c = expected_children !== undefined ? Number(expected_children) : (row.expected_children || 0);
      const total = expected_attendees !== undefined ? Number(expected_attendees) : (a + c);
      const note = rsvp_response_note !== undefined ? rsvp_response_note : (row.rsvp_response_note || '');
      const stay = stay_preference !== undefined ? stay_preference : (row.stay_preference || 'No need of stay');

      await dbRun(`
        UPDATE guests SET
          rsvp_status = ?,
          expected_adults = ?,
          expected_children = ?,
          expected_attendees = ?,
          rsvp_response_note = ?,
          stay_preference = ?,
          updated_at = datetime('now')
        WHERE rsvp_token = ?
      `, [rsvp_status, a, c, total, note, stay, token]);

      const updated = await dbGet('SELECT * FROM guests WHERE rsvp_token = ?', [token]);
      guest = formatGuest(updated);
    } else {
      const d = readJSON();
      const idx = (d.guests || []).findIndex(g => g.rsvp_token === token);
      if (idx === -1) return res.status(404).json({ error: 'Invitation not found.' });

      const a = expected_adults !== undefined ? Number(expected_adults) : (d.guests[idx].expected_adults || 1);
      const c = expected_children !== undefined ? Number(expected_children) : (d.guests[idx].expected_children || 0);
      const total = expected_attendees !== undefined ? Number(expected_attendees) : (a + c);
      const note = rsvp_response_note !== undefined ? rsvp_response_note : (d.guests[idx].rsvp_response_note || '');
      const stay = stay_preference !== undefined ? stay_preference : (d.guests[idx].stay_preference || 'No need of stay');

      d.guests[idx].rsvp_status = rsvp_status;
      d.guests[idx].expected_adults = a;
      d.guests[idx].expected_children = c;
      d.guests[idx].expected_attendees = total;
      d.guests[idx].rsvp_response_note = note;
      d.guests[idx].stay_preference = stay;
      d.guests[idx].updated_at = new Date().toISOString();
      writeJSON(d);
      guest = formatGuest(d.guests[idx]);
    }

    res.json({
      success: true,
      message: rsvp_status === 'Confirmed'
        ? 'Thank you! Your attendance has been joyfully confirmed.'
        : rsvp_status === 'Maybe'
        ? 'Thank you! Your response has been noted as tentative.'
        : 'Thank you for letting us know. We will miss you!',
      guest
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit route for RSVP portal direct links
app.get('/rsvp/:token', (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => res.status(200).send('OK'));

// ─── Catch-all ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
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
