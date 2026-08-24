const fs = require('fs');
let code = fs.readFileSync('client/src/utils/api.js', 'utf8');

const newApi = `  scanReceipt: async (image, mimeType) => {
    const res = await fetch(\`\${API_URL}/api/expenses/scan\`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, mimeType })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to scan receipt');
    }
    return res.json();
  },
  
  uploadDocument: async (fileBase64, filename) => {
    const res = await fetch(\`\${API_URL}/api/upload\`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: fileBase64, filename })
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },`;

code = code.replace(
  `  scanReceipt: async (image, mimeType) => {
    const res = await fetch(\`\${API_URL}/api/expenses/scan\`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, mimeType })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to scan receipt');
    }
    return res.json();
  },`,
  newApi
);

fs.writeFileSync('client/src/utils/api.js', code);
console.log("api.js patched.");
