import React, { useState } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import Login     from './components/Login'
import Sidebar   from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Expenses  from './components/Expenses'
import Savings   from './components/Savings'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function MainApp() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard')
  
  React.useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])

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
