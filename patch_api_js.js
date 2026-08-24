const fs = require('fs');
let code = fs.readFileSync('client/src/utils/api.js', 'utf8');

const targetStr = `  scanReceipt: (image, mimeType) =>
    fetch('/api/expenses/scan', {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ image, mimeType })
    }).then(handleResponse),`;

const replaceStr = targetStr + `\n
  uploadDocument: (fileBase64, filename) =>
    fetch('/api/upload', {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ file: fileBase64, filename })
    }).then(handleResponse),`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('client/src/utils/api.js', code);
console.log("api.js patched properly.");
