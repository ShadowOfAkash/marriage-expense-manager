import fs from 'fs';
let code = fs.readFileSync('src/contexts/AuthContext.jsx', 'utf8');
code = code.replace(/\/\*([\s\S]*?)\*\//g, '$1'); 
code = code.replace(/onAuthStateChanged\(auth, \(user\) => \{[\s\S]*?\}\)/, 'onAuthStateChanged(auth, (user) => {})');
fs.writeFileSync('src/contexts/AuthContext.jsx', code);
