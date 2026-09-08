const fs = require('fs');
let content = fs.readFileSync('client/src/components/Login.jsx', 'utf8');

content = content.replace(/text-blue-600/g, 'text-black');
content = content.replace(/bg-slate-900/g, 'bg-black');
content = content.replace(/bg-slate-800/g, 'bg-gray-800');

fs.writeFileSync('client/src/components/Login.jsx', content);
