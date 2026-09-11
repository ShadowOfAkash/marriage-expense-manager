const fs = require('fs');
const crypto = require('crypto');
const { DATA_FILE } = require('../config/env');

const DEFAULT_DB = {
  budget: { amount: 0 },
  payments: [],
  expenses: [],
  savings: [],
  bookings: [],
  guests: [],
  _nextPaymentId: 1,
  _nextExpenseId: 1,
  _nextSavingsId: 1,
  _nextGuestId: 1001
};

function generateRsvpToken(id) {
  return 'rsvp_' + crypto.randomBytes(8).toString('hex') + (id ? ('_' + id) : '');
}

function readJSON() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    }
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
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
  } catch (err) {
    console.error('Error reading JSON DB, returning default structure:', err.message);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
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
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  readJSON,
  writeJSON,
  generateRsvpToken
};
