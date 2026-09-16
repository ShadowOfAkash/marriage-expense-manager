let db = null;
let useLibSQL = false;

async function initLibSQL() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    return false;
  }

  try {
    const { createClient } = require('@libsql/client');
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    useLibSQL = true;
    console.log('📡 Connected to Turso (cloud SQLite)');

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

    // Column additions and backward compatibility migrations
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
    try { await db.execute("ALTER TABLE guests ADD COLUMN telegram_chat_id TEXT DEFAULT NULL"); } catch(e){}
    try { await db.execute("ALTER TABLE guests ADD COLUMN invitation_channel TEXT DEFAULT NULL"); } catch(e){}
    try { await db.execute("UPDATE guests SET rsvp_status = 'Pending Invitation' WHERE rsvp_status = 'Not Responded' OR rsvp_status IS NULL"); } catch(e){}
    try {
      await db.execute(`
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
        )
      `);
    } catch(e){}

    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS checklist_tasks (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id           TEXT    UNIQUE,
          user_id           TEXT    NOT NULL DEFAULT 'legacy_user',
          title             TEXT    NOT NULL,
          category          TEXT    NOT NULL DEFAULT 'General',
          timeline_stage    TEXT    NOT NULL DEFAULT 'General',
          due_date          TEXT    DEFAULT '',
          completed         INTEGER DEFAULT 0,
          completed_at      TEXT    DEFAULT NULL,
          priority          TEXT    DEFAULT 'Medium',
          assigned_to       TEXT    DEFAULT '',
          estimated_cost    REAL    DEFAULT 0,
          actual_cost       REAL    DEFAULT 0,
          linked_booking_id INTEGER DEFAULT NULL,
          linked_payment_id INTEGER DEFAULT NULL,
          notes             TEXT    DEFAULT '',
          is_custom         INTEGER DEFAULT 0,
          sort_order        INTEGER DEFAULT 0,
          created_at        TEXT    DEFAULT (datetime('now')),
          updated_at        TEXT    DEFAULT (datetime('now'))
        )
      `);
      await db.execute("CREATE INDEX IF NOT EXISTS idx_checklist_user ON checklist_tasks (user_id)");
      await db.execute("CREATE INDEX IF NOT EXISTS idx_checklist_stage ON checklist_tasks (user_id, timeline_stage)");
    } catch(e){}

    console.log('✅ Turso tables ready');
    return true;
  } catch (e) {
    console.error('Turso connection failed, falling back to JSON:', e.message);
    useLibSQL = false;
    db = null;
    return false;
  }
}

async function dbGet(sql, args = []) {
  if (useLibSQL && db) {
    const res = await db.execute({ sql, args });
    return res.rows[0] || null;
  }
  throw new Error('dbGet called in JSON mode');
}

async function dbAll(sql, args = []) {
  if (useLibSQL && db) {
    const res = await db.execute({ sql, args });
    return res.rows;
  }
  throw new Error('dbAll called in JSON mode');
}

async function dbRun(sql, args = []) {
  if (useLibSQL && db) {
    const res = await db.execute({ sql, args });
    return { lastInsertRowid: res.lastInsertRowid };
  }
  throw new Error('dbRun called in JSON mode');
}

module.exports = {
  initLibSQL,
  isLibSQL: () => useLibSQL,
  dbGet,
  dbAll,
  dbRun
};
