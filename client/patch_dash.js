const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

code = code.replace(
  'const key = (yr, mo) => `${MONTH_NAMES[mo].slice(0,3)} \\'${String(yr).slice(2)}`',
  `const key = (yr, mo) => {
      if (typeof mo !== 'number' || mo < 0 || mo > 11 || !MONTH_NAMES[mo]) {
        console.error("INVALID MO:", mo, "yr:", yr);
        return "Invalid";
      }
      return \`\${MONTH_NAMES[mo].slice(0,3)} '\${String(yr).slice(2)}\`;
    }`
);

code = code.replace(
  'return { name: `${s.month.slice(0,3)} \\'${String(s.year).slice(2)}`, monthly: s.amount, cumulative: cum }',
  `if (!s.month) { console.error("MISSING MONTH:", s); return { name: "Invalid", monthly: 0, cumulative: 0 }; }
   return { name: \`\${s.month.slice(0,3)} '\${String(s.year).slice(2)}\`, monthly: s.amount, cumulative: cum }`
);

fs.writeFileSync('src/components/Dashboard.jsx', code);
