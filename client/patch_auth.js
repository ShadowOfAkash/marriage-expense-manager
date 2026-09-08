const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.jsx', 'utf8');
code = code.replace(
  'const [currentUser, setCurrentUser] = useState(null)',
  'const [currentUser, setCurrentUser] = useState({ uid: "123", email: "test@test.com" })'
);
code = code.replace(
  'const [loading, setLoading] = useState(true)',
  'const [loading, setLoading] = useState(false)'
);
fs.writeFileSync('src/contexts/AuthContext.jsx', code);
