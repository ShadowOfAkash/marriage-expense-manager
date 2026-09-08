import fs from 'fs';
const db = JSON.parse(fs.readFileSync('../marriage_data.json', 'utf8'));

let invalid = false;
db.expenses.forEach(e => {
  const d = new Date(e.date);
  if (isNaN(d.getMonth())) {
    console.error('INVALID DATE FOUND IN EXPENSES:', e);
    invalid = true;
  }
});
if (!invalid) console.log('ALL DATES VALID');
