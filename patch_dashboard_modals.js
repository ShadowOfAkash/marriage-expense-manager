const fs = require('fs');
let code = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

// Add imports
code = code.replace(
  "import { useAuth } from '../contexts/AuthContext'",
  "import { useAuth } from '../contexts/AuthContext'\nimport { AddExpenseModal, AddSavingModal } from './SharedModals'"
);

// Add useDisclosure hooks
code = code.replace(
  "const [categories, setCategories] = useState([])",
  "const [categories, setCategories] = useState([])\n  const { isOpen: isAddExpOpen, onOpen: onAddExpOpen, onClose: onAddExpClose } = useDisclosure()\n  const { isOpen: isAddSavOpen, onOpen: onAddSavOpen, onClose: onAddSavClose } = useDisclosure()"
);

// Change onClick handlers
code = code.replace(
  "onClick={() => navigate('/expenses', { state: { openAddModal: true } })}",
  "onClick={onAddExpOpen}"
);
code = code.replace(
  "onClick={() => navigate('/savings', { state: { openAddModal: true } })}",
  "onClick={onAddSavOpen}"
);

// Render modals at the bottom
code = code.replace(
  "</Box>\n    </Container>",
  `</Box>
      <AddExpenseModal isOpen={isAddExpOpen} onClose={onAddExpClose} onSuccess={fetchSummary} />
      <AddSavingModal isOpen={isAddSavOpen} onClose={onAddSavClose} onSuccess={fetchSummary} />
    </Container>`
);

fs.writeFileSync('client/src/components/Dashboard.jsx', code);
console.log('Dashboard patched to use inline Modals!');
