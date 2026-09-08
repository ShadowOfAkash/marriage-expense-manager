import fs from 'fs';
const db = JSON.parse(fs.readFileSync('../marriage_data.json', 'utf8'));
db.expenses.forEach(e => {
  if (!e.date) console.log("MISSING DATE", e);
});
