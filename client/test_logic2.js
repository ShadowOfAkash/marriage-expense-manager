import fs from 'fs';
const db = JSON.parse(fs.readFileSync('../marriage_data.json', 'utf8'));

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const key = (yr, mo) => `${MONTH_NAMES[mo].slice(0,3)} '${String(yr).slice(2)}`

db.savings.forEach(s => {
  const mo = MONTH_NAMES.indexOf(s.month);
  try {
    key(s.year, mo);
  } catch(err) {
    console.error('FAILED ON SAVING:', s, err.message);
  }
});
