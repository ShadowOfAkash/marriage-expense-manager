const { initLibSQL, isLibSQL, dbGet, dbAll, dbRun } = require('./libsql');
const { readJSON, writeJSON, generateRsvpToken } = require('./jsonDb');

async function initDB() {
  const connected = await initLibSQL();
  if (!connected) {
    console.log('📁 Using local JSON file database');
    // Ensure default JSON DB is written if absent
    readJSON();
  }
}

module.exports = {
  initDB,
  isLibSQL,
  dbGet,
  dbAll,
  dbRun,
  readJSON,
  writeJSON,
  generateRsvpToken
};
