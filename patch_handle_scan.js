const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

code = code.replace(
  "const EMPTY_FORM = { category: '', description: '', amount: '', date: '' }",
  "const EMPTY_FORM = { category: '', description: '', amount: '', date: '', receipt_url: '' }"
);

const oldSetForm = `          setForm({
            category: aiData.category || '',
            description: aiData.description || '',
            amount: aiData.amount ? String(aiData.amount) : '',
            date: aiData.date || today()
          })`;

const newSetForm = `          setForm(prev => ({
            ...prev,
            category: aiData.category || '',
            description: aiData.description || '',
            amount: aiData.amount ? String(aiData.amount) : '',
            date: aiData.date || today(),
            receipt_url: aiData.receipt_url || ''
          }))`;

code = code.replace(oldSetForm, newSetForm);
fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log('Fixed handleScan and EMPTY_FORM!');
