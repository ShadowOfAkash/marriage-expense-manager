const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const oldTelegramSave = `
    let aiData = JSON.parse(text);

    // 3. Save to database as DRAFT
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || new Date().toISOString().split('T')[0];
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'Telegram Upload';
    
    if (useLibSQL) {
      await dbRun(
        'INSERT INTO expenses (category, description, amount, date, status) VALUES (?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft']
      );
    } else {
      const d = readJSON();
      d.expenses.push({ id: d._nextExpenseId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', created_at: new Date().toISOString() });
      writeJSON(d);
    }`;

const newTelegramSave = `
    let aiData = JSON.parse(text);

    // Save image to uploads folder
    const fsPath = require('path');
    const uploadsDir = fsPath.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    
    // Create a filename from the telegram file path (e.g. photos/file_2.jpg)
    const ext = fsPath.extname(filePath) || '.jpg';
    const finalName = 'tg_' + Date.now() + '_' + Math.random().toString(36).substring(7) + ext;
    const savePath = fsPath.join(uploadsDir, finalName);
    
    // Write buffer to disk
    fs.writeFileSync(savePath, Buffer.from(arrayBuffer));
    const receipt_url = '/uploads/' + finalName;

    // 3. Save to database as DRAFT
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || new Date().toISOString().split('T')[0];
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'Telegram Upload';
    
    if (useLibSQL) {
      await dbRun(
        'INSERT INTO expenses (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url]
      );
    } else {
      const d = readJSON();
      d.expenses.push({ id: d._nextExpenseId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', receipt_url, created_at: new Date().toISOString() });
      writeJSON(d);
    }`;

code = code.replace(oldTelegramSave, newTelegramSave);

fs.writeFileSync('server.js', code);
console.log("Patched server.js Telegram webhook!");
