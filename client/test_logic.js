import fs from 'fs';
const db = JSON.parse(fs.readFileSync('../marriage_data.json', 'utf8'));

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const key = (yr, mo) => `${MONTH_NAMES[mo].slice(0,3)} '${String(yr).slice(2)}`

db.expenses.forEach(e => {
  const d = new Date(e.date);
  try {
    key(d.getFullYear(), d.getMonth());
  } catch(err) {
    console.error('FAILED ON EXPENSE:', e, err.message);
  }
});
