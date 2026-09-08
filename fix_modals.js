const fs = require('fs');
let content = fs.readFileSync('client/src/components/SharedModals.jsx', 'utf8');

// Change modal titles from Expense to Payment
content = content.replace(/title="Add New Expense"/g, 'title="Add New Payment"');
content = content.replace(/Save Expense/g, 'Save Payment');
content = content.replace(/Load Expense/g, 'Load Payment');

fs.writeFileSync('client/src/components/SharedModals.jsx', content);
