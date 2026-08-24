const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

// For Add Expense
code = code.replace(
  '<Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="xl">',
  '<Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="3xl">'
);

// For Edit Expense
code = code.replace(
  '<Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size="md">',
  '<Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size="2xl">'
);

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log('Modal sizes increased!');
