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

const validTokens = new Set();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
      CREATE TABLE IF NOT EXISTS budget (
        id         INTEGER PRIMARY KEY DEFAULT 1,
        amount     REAL    NOT NULL DEFAULT 0,
        updated_at TEXT    DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO budget (id, amount) VALUES (1, 0);

      CREATE TABLE IF NOT EXISTS expenses (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        category    TEXT    NOT NULL,
        description TEXT    DEFAULT '',
        amount      REAL    NOT NULL,
        date        TEXT    NOT NULL,
        created_at  TEXT    DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS savings (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        month      TEXT    NOT NULL,
        year       INTEGER NOT NULL,
        amount     REAL    NOT NULL,
        note       TEXT    DEFAULT '',
        created_at TEXT    DEFAULT (datetime('now'))
      );
    `);
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
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  if (!validTokens.has(auth.slice(7))) return res.status(401).json({ error: 'Invalid or expired session' });
  next();
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

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/expenses', requireAuth, async (req, res) => {
  try {
    if (useLibSQL) return res.json(await dbAll('SELECT * FROM expenses ORDER BY date DESC, id DESC'));
    res.json([...readJSON().expenses].sort((a, b) => b.date.localeCompare(a.date)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', requireAuth, async (req, res) => {
  const { category, description, amount, date } = req.body;
  if (!category || !amount || !date) return res.status(400).json({ error: 'Category, amount and date required' });
  try {
    if (useLibSQL) {
      const r = await dbRun(
        'INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)',
        [category, description || '', Number(amount), date]
      );
      const row = await dbGet('SELECT * FROM expenses WHERE id = ?', [r.lastInsertRowid]);
      return res.status(201).json(row);
    }
    const d = readJSON();
    const expense = { id: d._nextExpenseId++, category, description: description || '', amount: Number(amount), date, created_at: new Date().toISOString() };
    d.expenses.push(expense); writeJSON(d);
    res.status(201).json(expense);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/expenses/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { category, description, amount, date } = req.body;
  try {
    if (useLibSQL) {
      await dbRun('UPDATE expenses SET category=?,description=?,amount=?,date=? WHERE id=?',
        [category, description || '', Number(amount), date, id]);
      const row = await dbGet('SELECT * FROM expenses WHERE id = ?', [id]);
      return res.json(row);
    }
    const d = readJSON(); const idx = d.expenses.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.expenses[idx] = { ...d.expenses[idx], category, description: description || '', amount: Number(amount), date };
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

// ─── Catch-all ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ──────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n💒 Marriage Expense Manager running at:\n   ➜  http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
