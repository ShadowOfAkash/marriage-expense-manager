const fs = require('fs');
let code = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

code = code.replace(
  "import { LayoutDashboard, ReceiptText, PiggyBank, Target } from 'lucide-react'",
  "import { LayoutDashboard, ReceiptText, PiggyBank, Target, LogOut } from 'lucide-react'\nimport { useAuth } from '../contexts/AuthContext'"
);

code = code.replace(
  "export default function Sidebar({ activeTab, setActiveTab }) {",
  "export default function Sidebar({ activeTab, setActiveTab }) {\n  const { logout, currentUser } = useAuth();"
);

const logoutBtn = `
      <Box mt="auto">
        <Text fontSize="11px" color="brand.400" mb={2} px={2} isTruncated>{currentUser?.email}</Text>
        <Button
          w="100%"
          variant="ghost"
          color="gray.400"
          justifyContent="flex-start"
          leftIcon={<LogOut size={18} />}
          _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
          onClick={logout}
        >
          Sign Out
        </Button>
      </Box>
    </Flex>
`;

code = code.replace("    </Flex>", logoutBtn);
fs.writeFileSync('client/src/components/Sidebar.jsx', code);
console.log('Sidebar.jsx patched for auth');
