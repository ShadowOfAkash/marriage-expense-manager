const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Add express.static for root uploads
code = code.replace(
  "app.use(express.static(path.join(__dirname, 'public')));",
  "app.use(express.static(path.join(__dirname, 'public')));\napp.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));"
);

// 2. Change all 'public/uploads' to 'uploads' and add mkdirSync
code = code.replace(
  "fs.writeFileSync(require('path').join(__dirname, 'public/uploads', filename), imgBuffer);",
  "const dir = require('path').join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(require('path').join(dir, filename), imgBuffer);"
);

code = code.replace(
  "fs.writeFileSync(path.join(__dirname, 'public/uploads', finalName), buffer);",
  "const dir = path.join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(path.join(dir, finalName), buffer);"
);

// Telegram webhook replacement
code = code.replace(
  "fs.writeFileSync(require('path').join(__dirname, 'public/uploads', filename), imgBuffer);",
  "const dir = require('path').join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(require('path').join(dir, filename), imgBuffer);"
);

fs.writeFileSync('server.js', code);
console.log("server.js patched for safe uploads folder.");
