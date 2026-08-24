const fs = require('fs');
let code = fs.readFileSync('client/src/App.jsx', 'utf8');

const oldState = "const [activeTab, setActiveTab] = useState('dashboard')";
const newState = `const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard')
  
  React.useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])`;

code = code.replace(oldState, newState);
fs.writeFileSync('client/src/App.jsx', code);
console.log('App.jsx patched to persist active tab in localStorage!');
