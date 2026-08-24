const fs = require('fs');
let code = fs.readFileSync('client/src/components/Savings.jsx', 'utf8');

code = code.replace(
  "const cancelRef = React.useRef()",
  "const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure()\n  const cancelRef = React.useRef()"
);

fs.writeFileSync('client/src/components/Savings.jsx', code);
console.log("Fixed Savings.jsx!");
