const fs = require('fs');
let code = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

// Add the state
code = code.replace(
  "const [telegramCode, setTelegramCode] = useState(null)",
  "const [telegramCode, setTelegramCode] = useState(null)\n  const [isTelegramLinked, setIsTelegramLinked] = useState(false)"
);

// Update fetch logic
code = code.replace(
  "const [sum, exp, sav, cats] = await Promise.all([\n        api.getSummary(), api.getExpenses(), api.getSavings(), api.getCategories(),\n      ])",
  "const [sum, exp, sav, cats, tgStatus] = await Promise.all([\n        api.getSummary(), api.getExpenses(), api.getSavings(), api.getCategories(), api.getTelegramStatus().catch(() => ({isLinked: false, activeCode: null}))\n      ])"
);

code = code.replace(
  "setSummary(sum); setExpenses(exp); setSavings(sav); setCategories(cats)",
  "setSummary(sum); setExpenses(exp); setSavings(sav); setCategories(cats)\n      if (tgStatus.activeCode) setTelegramCode(tgStatus.activeCode);\n      if (tgStatus.isLinked) setIsTelegramLinked(true);"
);

// Update rendering
const newRender = `                  <Text fontWeight="700" color="blue.700">Telegram</Text>
                  {isTelegramLinked ? (
                     <Text fontSize="xs" fontWeight="bold" color="green.500">Connected ✓</Text>
                  ) : telegramCode ? (
                     <Text fontSize="xs" fontWeight="bold" color="blue.500">Code: {telegramCode}</Text>
                  ) : (
                     <Text fontSize="sm" color="gray.500">{generatingCode ? 'Loading...' : 'Link account'}</Text>
                  )}
                </Box>`;

code = code.replace(
  `<Text fontWeight="700" color="blue.700">Connect Telegram</Text>
                  {telegramCode ? (
                     <Text fontSize="xs" fontWeight="bold" color="blue.500">Code: {telegramCode}</Text>
                  ) : (
                     <Text fontSize="sm" color="gray.500">{generatingCode ? 'Loading...' : 'Link your account'}</Text>
                  )}
                </Box>`,
  newRender
);

fs.writeFileSync('client/src/components/Dashboard.jsx', code);
console.log('Dashboard patched with active code state!');
