import React from 'react'
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
