const fs = require('fs');
const files = [
  'client/src/components/Sidebar.jsx',
  'client/src/components/Dashboard.jsx',
  'client/src/components/Expenses.jsx',
  'client/src/components/Savings.jsx',
  'client/src/components/SharedModals.jsx',
  'client/src/components/TailwindModal.jsx',
  'client/src/components/Login.jsx',
  'client/src/App.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-slate-/g, 'bg-zinc-');
  content = content.replace(/text-slate-/g, 'text-zinc-');
  content = content.replace(/border-slate-/g, 'border-zinc-');
  content = content.replace(/divide-slate-/g, 'divide-zinc-');
  content = content.replace(/hover:bg-slate-/g, 'hover:bg-zinc-');
  content = content.replace(/shadow-slate-/g, 'shadow-zinc-');

  fs.writeFileSync(file, content);
});

console.log("Replaced slate successfully.");
