const fs = require('fs');
let code = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

if (!code.includes('useAuth')) {
  code = code.replace(
    "import { LayoutDashboard, Receipt, PiggyBank, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';",
    "import { LayoutDashboard, Receipt, PiggyBank, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';\nimport { useAuth } from '../contexts/AuthContext';"
  );
}

if (!code.includes('const { logout, currentUser } = useAuth();')) {
  code = code.replace(
    "export default function Sidebar({ activeTab, setActiveTab, onLogout }) {",
    "export default function Sidebar({ activeTab, setActiveTab, onLogout }) {\n  const { logout, currentUser } = useAuth();"
  );
}

fs.writeFileSync('client/src/components/Sidebar.jsx', code);
console.log('Sidebar.jsx fixed for missing variables!');
