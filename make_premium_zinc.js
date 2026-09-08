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
  
  // replace pure blacks with premium zinc shades
  content = content.replace(/bg-black/g, 'bg-zinc-900');
  content = content.replace(/text-black/g, 'text-zinc-900');
  content = content.replace(/border-black/g, 'border-zinc-900');
  content = content.replace(/hover:bg-black/g, 'hover:bg-zinc-950');
  content = content.replace(/hover:text-black/g, 'hover:text-zinc-950');
  
  // convert all grays to zincs for a cohesive premium temperature
  content = content.replace(/bg-gray-/g, 'bg-zinc-');
  content = content.replace(/text-gray-/g, 'text-zinc-');
  content = content.replace(/border-gray-/g, 'border-zinc-');
  content = content.replace(/divide-gray-/g, 'divide-zinc-');
  content = content.replace(/hover:bg-gray-/g, 'hover:bg-zinc-');
  content = content.replace(/shadow-gray-/g, 'shadow-zinc-');
  content = content.replace(/from-gray-/g, 'from-zinc-');
  content = content.replace(/to-gray-/g, 'to-zinc-');
  content = content.replace(/via-gray-/g, 'via-zinc-');
  
  // Charts updates
  if (file.includes('Dashboard.jsx')) {
     content = content.replace(/stroke="#000000"/g, 'stroke="#27272a"');
     content = content.replace(/fill="#000000"/g, 'fill="#27272a"');
     content = content.replace(/const COLORS = \['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#525252'\];/g, "const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];");
  }

  // Make the Sidebar background super deep
  if (file.includes('Sidebar.jsx')) {
      content = content.replace(/bg-zinc-900/g, 'bg-zinc-950');
  }

  fs.writeFileSync(file, content);
});

console.log("Replaced colors successfully.");
