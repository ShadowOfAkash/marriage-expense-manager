const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Add Firebase Admin init
const adminInit = `const admin = require('firebase-admin');
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in environment');
  }
} catch (e) {
  console.error('❌ Failed to initialize Firebase Admin:', e.message);
}

// Keep a fallback for development if they haven't configured it yet
`;

code = code.replace("const validTokens = new Set();", adminInit + "\nconst validTokens = new Set();");

// 2. Replace requireAuth
const oldAuth = `function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  if (!validTokens.has(auth.slice(7))) return res.status(401).json({ error: 'Invalid or expired session' });
  next();
}`;

const newAuth = `async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  
  const token = auth.slice(7);
  
  try {
    // Check if Firebase is initialized and verify the token
    if (admin.apps.length > 0) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken; // contains .uid
      return next();
    }
  } catch (error) {
    console.error("Firebase auth error:", error.message);
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Fallback to legacy mock auth ONLY if Firebase isn't configured yet
  if (!admin.apps.length && validTokens.has(token)) {
    req.user = { uid: 'legacy_user' };
    return next();
  }
  
  return res.status(401).json({ error: 'Invalid or expired session' });
}`;

code = code.replace(oldAuth, newAuth);

// 3. Database Schema Updates
// In initDb(), add user_id column
const oldTables = `
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
    \`);
    try { await db.execute("ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'approved'"); } catch(e){}
    try { await db.execute("ALTER TABLE expenses ADD COLUMN receipt_url TEXT DEFAULT ''"); } catch(e){}
`;

const newTables = `
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
    \`);
    try { await db.execute("ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'approved'"); } catch(e){}
    try { await db.execute("ALTER TABLE expenses ADD COLUMN receipt_url TEXT DEFAULT ''"); } catch(e){}
    try { await db.execute("ALTER TABLE expenses ADD COLUMN user_id TEXT DEFAULT 'legacy_user'"); } catch(e){}
    try { await db.execute("ALTER TABLE savings ADD COLUMN user_id TEXT DEFAULT 'legacy_user'"); } catch(e){}
`;

code = code.replace(oldTables, newTables);

// 4. Update the routes to use req.user.uid
// E.g., 'SELECT * FROM expenses' -> 'SELECT * FROM expenses WHERE user_id = ?', [req.user.uid]

code = code.replace(
  "await dbAll('SELECT * FROM expenses ORDER BY date DESC, id DESC')",
  "await dbAll('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [req.user.uid])"
);

code = code.replace(
  "await dbRun('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)', [category, description, Number(amount), date])",
  "await dbRun('INSERT INTO expenses (category, description, amount, date, user_id) VALUES (?, ?, ?, ?, ?)', [category, description, Number(amount), date, req.user.uid])"
);

code = code.replace(
  "await dbRun('UPDATE expenses SET category=?, description=?, amount=?, date=? WHERE id=?', [category, description, Number(amount), date, req.params.id])",
  "await dbRun('UPDATE expenses SET category=?, description=?, amount=?, date=? WHERE id=? AND user_id=?', [category, description, Number(amount), date, req.params.id, req.user.uid])"
);

code = code.replace(
  "await dbRun('DELETE FROM expenses WHERE id=?', [req.params.id])",
  "await dbRun('DELETE FROM expenses WHERE id=? AND user_id=?', [req.params.id, req.user.uid])"
);

code = code.replace(
  "await dbAll('SELECT * FROM savings ORDER BY year DESC, month DESC, id DESC')",
  "await dbAll('SELECT * FROM savings WHERE user_id = ? ORDER BY year DESC, month DESC, id DESC', [req.user.uid])"
);

code = code.replace(
  "await dbRun('INSERT INTO savings (month, year, amount, note) VALUES (?, ?, ?, ?)', [month, Number(year), Number(amount), note])",
  "await dbRun('INSERT INTO savings (month, year, amount, note, user_id) VALUES (?, ?, ?, ?, ?)', [month, Number(year), Number(amount), note, req.user.uid])"
);

code = code.replace(
  "await dbRun('DELETE FROM savings WHERE id=?', [req.params.id])",
  "await dbRun('DELETE FROM savings WHERE id=? AND user_id=?', [req.params.id, req.user.uid])"
);

code = code.replace(
  "const [row] = await dbAll('SELECT amount FROM budget WHERE id=1')",
  "const [row] = await dbAll('SELECT amount FROM user_budget WHERE user_id=?', [req.user.uid])"
);

code = code.replace(
  "await dbRun('UPDATE budget SET amount=? WHERE id=1', [Number(amount)])",
  "await dbRun('INSERT INTO user_budget (user_id, amount) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET amount=excluded.amount', [req.user.uid, Number(amount)])"
);

fs.writeFileSync('server.js', code);
console.log('server.js patched for multi-tenant Firebase auth');
