const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

code = code.replace(
  '<Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="3xl">',
  '<Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="xl">'
);
code = code.replace(
  '<Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size="2xl">',
  '<Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size="md">'
);

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log('Modal sizes matched to Add Savings!');
