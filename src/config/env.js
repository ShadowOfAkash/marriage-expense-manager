const path = require('path');
const dns  = require('node:dns');
require('dotenv').config();

// Force IPv4 first for all DNS lookups (critical for cloud hosts like Render/Railway/Heroku connecting to smtp.gmail.com)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const ROOT_DIR = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DATA_FILE = path.join(ROOT_DIR, 'marriage_data.json');

const PORT = process.env.PORT || 3000;

// Hardcoded user credentials for basic auth
const USERS = [
  { email: 'akashtiwari.mnnit@gmail.com', password: 'Akashcse@25274', name: 'Akash Tiwari' }
];

const VALID_TOKENS = new Set();

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

module.exports = {
  PORT,
  ROOT_DIR,
  PUBLIC_DIR,
  UPLOADS_DIR,
  DATA_FILE,
  USERS,
  VALID_TOKENS,
  MONTH_ORDER
};
