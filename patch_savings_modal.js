const fs = require('fs');
let code = fs.readFileSync('client/src/components/Savings.jsx', 'utf8');

code = code.replace(
  '<SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>',
  '<SimpleGrid columns={{ base: 1, sm: 2 }} spacing={5}>'
);

code = code.replace(
  '<Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="xl">',
  '<Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="xl">' // Just ensuring size is xl
);

fs.writeFileSync('client/src/components/Savings.jsx', code);
console.log('Savings Modal UI patched!');
