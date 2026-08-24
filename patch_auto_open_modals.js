const fs = require('fs');

// 1. Dashboard.jsx
let dash = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');
dash = dash.replace(
  "onClick={() => navigate('/expenses')}",
  "onClick={() => navigate('/expenses', { state: { openAddModal: true } })}"
);
dash = dash.replace(
  "onClick={() => navigate('/savings')}",
  "onClick={() => navigate('/savings', { state: { openAddModal: true } })}"
);

// Fix the "black" colors to a nicer theme color
dash = dash.replace(
  /<Flex w="48px" h="48px" bg="brand\.900" color="white"/g,
  '<Flex w="48px" h="48px" bg="brand.50" color="brand.600"'
);

fs.writeFileSync('client/src/components/Dashboard.jsx', dash);

// 2. Expenses.jsx
let exp = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');
if (!exp.includes("import { useLocation }")) {
  exp = exp.replace(
    "import React, { useState, useEffect, useCallback } from 'react'",
    "import React, { useState, useEffect, useCallback } from 'react'\nimport { useLocation } from 'react-router-dom'"
  );
}
if (!exp.includes("location.state?.openAddModal")) {
  exp = exp.replace(
    "const toast = useToast()",
    "const toast = useToast()\n  const location = useLocation()\n\n  useEffect(() => {\n    if (location.state?.openAddModal) {\n      onAddOpen()\n      // Clear the state so it doesn't reopen on refresh\n      window.history.replaceState({}, '')\n    }\n  }, [location.state, onAddOpen])"
  );
}
fs.writeFileSync('client/src/components/Expenses.jsx', exp);

// 3. Savings.jsx
let sav = fs.readFileSync('client/src/components/Savings.jsx', 'utf8');
if (!sav.includes("import { useLocation }")) {
  sav = sav.replace(
    "import React, { useState, useEffect, useCallback } from 'react'",
    "import React, { useState, useEffect, useCallback } from 'react'\nimport { useLocation } from 'react-router-dom'"
  );
}
if (!sav.includes("location.state?.openAddModal")) {
  sav = sav.replace(
    "const toast = useToast()",
    "const toast = useToast()\n  const location = useLocation()\n\n  useEffect(() => {\n    if (location.state?.openAddModal) {\n      onAddOpen()\n      window.history.replaceState({}, '')\n    }\n  }, [location.state, onAddOpen])"
  );
}
fs.writeFileSync('client/src/components/Savings.jsx', sav);

console.log('Patched dashboard buttons to pass state and open modals automatically!');
