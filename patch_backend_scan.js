const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const oldScanBlock = `    const { image, mimeType } = req.body;
    const imgBuffer = Buffer.from(image, 'base64');
    const filename = \`scan_\${Date.now()}.jpg\`;
    const fs = require('fs');
    const dir = require('path').join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(require('path').join(dir, filename), imgBuffer);
    const receipt_url = \`/uploads/\${filename}\`;
    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Image data and mimeType are required.' });
    }`;

const newScanBlock = `    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Image data and mimeType are required.' });
    }
    const imgBuffer = Buffer.from(image, 'base64');
    const ext = mimeType === 'application/pdf' ? '.pdf' : '.jpg';
    const filename = \`scan_\${Date.now()}\${ext}\`;
    const fs = require('fs');
    const dir = require('path').join(__dirname, 'uploads'); if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(require('path').join(dir, filename), imgBuffer);
    const receipt_url = \`/uploads/\${filename}\`;`;

code = code.replace(oldScanBlock, newScanBlock);
fs.writeFileSync('server.js', code);
console.log('Backend /scan endpoint updated to support PDFs!');
