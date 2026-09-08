const fs = require('fs');
let s = fs.readFileSync('src/components/SharedModals.jsx', 'utf8');
s = s.replace(/onClose=\{[^}]+\}/g, 'onClose={onClose}');
fs.writeFileSync('src/components/SharedModals.jsx', s);

let d = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
d = d.replace(/onClose=\{[^}]+\}/g, 'onClose={() => setIsOpen(false)}');
d = d.replace("import { AddExpenseModal, AddSavingModal } from './SharedModals'", "import { AddExpenseModal, AddSavingModal } from './SharedModals'\nimport { TailwindModal } from './TailwindModal'");
fs.writeFileSync('src/components/Dashboard.jsx', d);
