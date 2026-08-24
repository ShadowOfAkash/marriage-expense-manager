const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

code = code.replace(
  "const [delId,     setDelId]     = useState(null)",
  "const [delId,     setDelId]     = useState(null)\n  const [viewerUrl, setViewerUrl] = useState(null)"
);

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Fixed Expenses.jsx state crash!");
