const fs = require('fs');
let code = fs.readFileSync('client/src/App.jsx', 'utf8');

const importAuth = `import { useState, useEffect } from 'react'
import { ChakraProvider, Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, Spinner, Center } from '@chakra-ui/react'
import { Menu } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
`;
code = code.replace(
  "import { useState, useEffect } from 'react'\nimport { ChakraProvider, Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent } from '@chakra-ui/react'\nimport { Menu } from 'lucide-react'",
  importAuth
);

const appContent = `
function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { currentUser } = useAuth()

  if (!currentUser) return <Login />

  return (
    <Box minH="100vh" bg="gray.50" display="flex">
`;

code = code.replace(
  "export default function App() {\n  const [activeTab, setActiveTab] = useState('dashboard')\n  const { isOpen, onOpen, onClose } = useDisclosure()\n\n  return (\n    <ChakraProvider theme={theme}>\n      <Box minH=\"100vh\" bg=\"gray.50\" display=\"flex\">",
  appContent
);

// We need to wrap App in AuthProvider
const appFooter = `
export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ChakraProvider>
  )
}
`;

code = code.replace("    </ChakraProvider>\n  )\n}", "  )\n}\n" + appFooter);
fs.writeFileSync('client/src/App.jsx', code);
console.log('App.jsx patched for auth');
