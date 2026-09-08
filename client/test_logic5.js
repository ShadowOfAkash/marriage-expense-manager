const db = require('../marriage_data.json');
db.expenses.forEach(e => {
  const d = new Date(e.date);
  if (isNaN(d.getMonth())) {
    console.error('INVALID DATE FOUND IN EXPENSES:', e);
  }
});
