const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(/gemini-1\.5-flash/g, 'gemini-3.6-flash');

fs.writeFileSync('server.js', code);
console.log('Fixed ALL gemini models in server.js!');
