const fs = require('fs');
const files = [
  'client/src/components/Dashboard.jsx',
  'client/src/components/Sidebar.jsx',
  'client/src/components/Navbar.jsx',
  'client/src/components/Login.jsx',
  'client/src/components/SharedModals.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace visible UI text
  content = content.replace(/Add Expense/g, 'Add Payment');
  content = content.replace(/Total Expenses/g, 'Total Payments');
  content = content.replace(/No expenses yet/g, 'No payments yet');
  content = content.replace(/No expenses found/g, 'No payments found');
  content = content.replace(/Expenses vs Budget/g, 'Payments vs Budget');
  content = content.replace(/Savings vs expenses/g, 'Savings vs payments');
  content = content.replace(/Recent Expenses/g, 'Recent Payments');
  content = content.replace(/No expenses logged yet/g, 'No payments logged yet');
  content = content.replace(/Add First Expense/g, 'Add First Payment');
  content = content.replace(/Expense Manager/g, 'Payment Manager');
  content = content.replace(/Expense saved!/g, 'Payment saved!');
  
  // Dashboard Recharts legend text
  content = content.replace(/name="Expenses" fill="#BE185D"/g, 'name="Payments" fill="#18181b"'); // also fixed the red color that was lingering
  
  // Sidebar/Navbar labels
  content = content.replace(/label: 'Expenses'/g, "label: 'Payments'");

  fs.writeFileSync(file, content);
});

console.log("Converted UI text to Payments");
