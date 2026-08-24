const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

code = code.replace(
  "{['#','Date','Category','Description','Amount','Receipt','Actions'].map(h => (",
  "{['#','Date','Category','Description','Receipt','Amount','Actions'].map(h => ("
);

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Patched Expenses table headers!");
