const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace(
  "const msg = req.body.message;",
  "console.log('Received webhook body:', JSON.stringify(req.body));\n  const msg = req.body.message;"
);
fs.writeFileSync('server.js', code);
