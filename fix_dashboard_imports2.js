const fs = require('fs');
let code = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

code = code.replace(
  "} from 'lucide-react'",
  "  Smartphone\n} from 'lucide-react'"
);

fs.writeFileSync('client/src/components/Dashboard.jsx', code);
console.log('Added Smartphone to imports!');
