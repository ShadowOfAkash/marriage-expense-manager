const fs = require('fs');
let content = fs.readFileSync('client/src/components/Savings.jsx', 'utf8');

content = content.replace(/text-green-600/g, 'text-black');
content = content.replace(/bg-green-600 text-white/g, 'bg-black text-white hover:bg-gray-800');
content = content.replace(/bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200/g, 'bg-gray-50 border border-gray-200');
content = content.replace(/text-green-800/g, 'text-gray-600');
content = content.replace(/text-green-900/g, 'text-black');
content = content.replace(/text-green-700/g, 'text-gray-900');
content = content.replace(/<Chip size="sm" variant="flat" color="default">/g, '<Chip size="sm" variant="flat" color="default" className="bg-gray-100 text-black border border-gray-300">');

fs.writeFileSync('client/src/components/Savings.jsx', content);
