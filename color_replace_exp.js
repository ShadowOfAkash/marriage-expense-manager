const fs = require('fs');
let content = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

content = content.replace(/text-pink-600/g, 'text-black');
content = content.replace(/bg-pink-600 text-white/g, 'bg-black text-white hover:bg-gray-800');
content = content.replace(/color="danger"/g, 'color="default" className="bg-gray-100 text-black border border-gray-300"');

fs.writeFileSync('client/src/components/Expenses.jsx', content);
