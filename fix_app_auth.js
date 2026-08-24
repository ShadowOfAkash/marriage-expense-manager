const fs = require('fs');
let code = fs.readFileSync('client/src/App.jsx', 'utf8');

const newApp = `import React, { useState } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import Login     from './components/Login'
import Sidebar   from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Expenses  from './components/Expenses'
import Savings   from './components/Savings'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function MainApp() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (!currentUser) return <Login />

  return (
    <Flex minH="100vh" bg="surface.bg">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <Box flex={1} overflowY="auto" pb={10}>
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'expenses'  && <Expenses />}
        {activeTab === 'savings'   && <Savings />}
      </Box>
    </Flex>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
`;

fs.writeFileSync('client/src/App.jsx', newApp);
console.log('App.jsx FIXED for AuthContext!');
