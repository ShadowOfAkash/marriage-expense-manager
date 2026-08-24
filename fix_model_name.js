const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(
  "const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });",
  "const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });"
);

fs.writeFileSync('server.js', code);
console.log('Restored gemini-3.6-flash!');
