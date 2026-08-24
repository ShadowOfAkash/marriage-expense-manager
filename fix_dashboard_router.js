const fs = require('fs');
let code = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

if (!code.includes("import { useNavigate }")) {
  code = code.replace(
    "import React, { useState, useEffect, useCallback, useMemo } from 'react'",
    "import React, { useState, useEffect, useCallback, useMemo } from 'react'\nimport { useNavigate } from 'react-router-dom'"
  );
}

fs.writeFileSync('client/src/components/Dashboard.jsx', code);
console.log('Fixed Dashboard imports');
