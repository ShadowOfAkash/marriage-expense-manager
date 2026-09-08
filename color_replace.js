const fs = require('fs');
let content = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

// Replace standard colors
content = content.replace(/bg-gradient-to-br from-blue-600 to-purple-600/g, 'bg-black');
content = content.replace(/bg-gradient-to-r from-blue-600 to-purple-600/g, 'bg-black');
content = content.replace(/text-blue-700 font-bold bg-blue-50/g, 'text-black font-bold bg-gray-100');
content = content.replace(/bg-blue-50 text-blue-600/g, 'bg-gray-100 text-black');
content = content.replace(/bg-blue-50 text-blue-700 border-blue-200/g, 'bg-gray-100 text-black border-gray-300');
content = content.replace(/bg-green-50 text-green-700 border border-green-200/g, 'bg-gray-100 text-black border border-gray-300');
content = content.replace(/bg-green-50 text-green-700 border-green-200/g, 'bg-gray-100 text-black border-gray-300');
content = content.replace(/border-blue-100/g, 'border-gray-200');
content = content.replace(/bg-\[#0088cc\]/g, 'bg-black');
content = content.replace(/bg-green-500/g, 'bg-gray-400');
content = content.replace(/bg-pink-600/g, 'bg-black');
content = content.replace(/bg-gradient-to-r from-green-500 to-green-600/g, 'bg-gray-400');
content = content.replace(/bg-gradient-to-r from-pink-600 to-pink-700/g, 'bg-black');
content = content.replace(/bg-\[#7F55B0\]/g, 'bg-gray-400');
content = content.replace(/bg-\[#BE185D\]/g, 'bg-black');
content = content.replace(/color="primary"/g, 'className="bg-black text-white hover:bg-gray-800"'); // for set budget goal button? Wait.
content = content.replace(/color="secondary"/g, ''); 

// Recharts colors
content = content.replace(/const COLORS = \[.*\];/, "const COLORS = ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#525252'];");
content = content.replace(/stroke="#be185d"/g, 'stroke="#000000"');
content = content.replace(/fill="#be185d"/g, 'fill="#000000"');
content = content.replace(/stroke="#7f55b0"/g, 'stroke="#737373"');
content = content.replace(/fill="#7f55b0"/g, 'fill="#737373"');
content = content.replace(/stroke="#10b981"/g, 'stroke="#404040"');
content = content.replace(/fill="#10b981"/g, 'fill="#404040"');
content = content.replace(/stroke="#8b5cf6"/g, 'stroke="#a3a3a3"');
content = content.replace(/fill="#8b5cf6"/g, 'fill="#a3a3a3"');

fs.writeFileSync('client/src/components/Dashboard.jsx', content);
