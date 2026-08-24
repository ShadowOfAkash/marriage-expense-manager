const fs = require('fs');

// 1. App.jsx
let appCode = fs.readFileSync('client/src/App.jsx', 'utf8');
appCode = `import React from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login     from './components/Login'
import Sidebar   from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Expenses  from './components/Expenses'
import Savings   from './components/Savings'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function MainApp() {
  const { currentUser } = useAuth()

  if (!currentUser) return <Login />

  return (
    <Flex minH="100vh" bg="surface.bg">
      <Sidebar />
      <Box flex={1} overflowY="auto" pb={10}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </Flex>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </BrowserRouter>
  )
}
`;
fs.writeFileSync('client/src/App.jsx', appCode);

// 2. Sidebar.jsx
let sidebarCode = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');
sidebarCode = sidebarCode.replace(
  "import { useAuth } from '../contexts/AuthContext';",
  "import { useAuth } from '../contexts/AuthContext';\nimport { useNavigate, useLocation } from 'react-router-dom';"
);
sidebarCode = sidebarCode.replace(
  "export default function Sidebar({ activeTab, setActiveTab }) {",
  "export default function Sidebar() {\n  const navigate = useNavigate();\n  const location = useLocation();\n  const activeTab = location.pathname.split('/')[1] || 'dashboard';"
);
sidebarCode = sidebarCode.replace(
  "onClick={() => setActiveTab(item.id)}",
  "onClick={() => navigate('/' + item.id)}"
);
fs.writeFileSync('client/src/components/Sidebar.jsx', sidebarCode);

// 3. Dashboard.jsx
let dashCode = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');
if (!dashCode.includes("import { useNavigate } from 'react-router-dom'")) {
  dashCode = dashCode.replace(
    "import React, { useState, useEffect } from 'react'",
    "import React, { useState, useEffect } from 'react'\nimport { useNavigate } from 'react-router-dom'"
  );
}
dashCode = dashCode.replace(
  "export default function Dashboard({ setActiveTab }) {",
  "export default function Dashboard() {\n  const navigate = useNavigate();"
);
dashCode = dashCode.replace(/setActiveTab\('expenses'\)/g, "navigate('/expenses')");
dashCode = dashCode.replace(/setActiveTab\('savings'\)/g, "navigate('/savings')");
fs.writeFileSync('client/src/components/Dashboard.jsx', dashCode);

console.log("Router integration complete!");
