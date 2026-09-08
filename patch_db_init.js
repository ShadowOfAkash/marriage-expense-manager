const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const createBookingsTable = `
    await dbRun(\`CREATE TABLE IF NOT EXISTS savings (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, month TEXT, year INTEGER, amount REAL, note TEXT
    )\`);

    await dbRun(\`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, vendor TEXT, service TEXT, booking_date TEXT, event_date TEXT, amount REAL, advance REAL, status TEXT, notes TEXT
    )\`);
`;

if (!code.includes('CREATE TABLE IF NOT EXISTS bookings')) {
  code = code.replace(/await dbRun\(\`CREATE TABLE IF NOT EXISTS savings \([\s\S]*?\)\`\);/m, createBookingsTable.trim());
  fs.writeFileSync('server.js', code);
  console.log("Patched LibSQL init for bookings table");
} else {
  console.log("Bookings table init already exists");
}
