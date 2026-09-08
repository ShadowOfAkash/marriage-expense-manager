import fs from 'fs';
const db = JSON.parse(fs.readFileSync('../marriage_data.json', 'utf8'));

db.savings.forEach(s => {
  if (s.month === undefined) {
    console.error('UNDEFINED MONTH IN SAVING:', s);
  }
});
