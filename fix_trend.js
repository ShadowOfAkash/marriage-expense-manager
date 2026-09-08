const fs = require('fs');
let code = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');
code = code.replace(
  'const savingsTimelineData = useMemo(() => {\n    let cum = 0\n    return savings.map(s => {\n      cum += s.amount\n      const m = s.month || \'Jan\'\n      const y = s.year || new Date().getFullYear()\n      return { name: `${m.slice(0,3)} \\'${String(y).slice(2)}`, monthly: s.amount, cumulative: cum }\n    })\n  }, [savings])',
  `const savingsTrend = useMemo(() => {
    const sorted = [...savings].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month)
    })
    let cum = 0
    return sorted.map(s => {
      cum += s.amount
      const m = s.month || 'Jan'
      const y = s.year || new Date().getFullYear()
      return { name: \`\${m.slice(0,3)} '\${String(y).slice(2)}\`, monthly: s.amount, cumulative: cum }
    })
  }, [savings])`
);
fs.writeFileSync('client/src/components/Dashboard.jsx', code);
