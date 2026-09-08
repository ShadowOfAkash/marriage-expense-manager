const fs = require('fs');
let content = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

content = content.replace(/text-green-500/g, 'text-black');
content = content.replace(/text-red-500/g, 'text-gray-500');
content = content.replace(/border-blue-600/g, 'border-black');
content = content.replace(/text-blue-700/g, 'text-black');
content = content.replace(/text-blue-500/g, 'text-gray-600');
content = content.replace(/baseColor="#E09913"/g, 'baseColor="#404040"');
content = content.replace(/bg-blue-50 text-blue-700 border border-blue-200/g, 'bg-gray-100 text-black border border-gray-300');
content = content.replace(/bg-blue-50 text-blue-700 border-blue-200/g, 'bg-gray-100 text-black border-gray-300');

fs.writeFileSync('client/src/components/Dashboard.jsx', content);
