import React, { useState, useEffect } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import Login     from './components/Login'
import Sidebar   from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Expenses  from './components/Expenses'
import Savings   from './components/Savings'

export default function App() {
  const [user,      setUser]      = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Restore session from localStorage
  useEffect(() => {
    const token    = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    if (token && userData) {
      try { setUser(JSON.parse(userData)) } catch (_) {}
    }
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(userData))
    setUser(userData)
    setActiveTab('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
    setActiveTab('dashboard')
  }

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <Flex minH="100vh" bg="surface.bg">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
      <Box flex={1} overflowY="auto" pb={10}>
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'expenses'  && <Expenses />}
        {activeTab === 'savings'   && <Savings />}
      </Box>
    </Flex>
  )
}
