const fs = require('fs');

// --- 1. Dashboard.jsx ---
let dashboard = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

// Replace the StatCard in Dashboard
const statCardOld = `// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, gradient, helpText, arrowType, onClick, subtext }) {
  return (
    <Card
      cursor={onClick ? 'pointer' : 'default'}
      transition="all 0.22s ease"
      _hover={{ transform: 'translateY(-4px)', shadow: '0 12px 36px rgba(0,0,0,0.12)' }}
      onClick={onClick}
      border="1px solid" borderColor="gray.100"
      shadow="0 2px 12px rgba(0,0,0,0.05)"
      overflow="hidden"
    >
      {/* Gradient top strip */}
      <Box h="3px" bgGradient={gradient} />
      <CardBody p={5}>
        <Flex justify="space-between" align="flex-start">
          <Stat flex={1}>
            <StatLabel
              fontSize="10px" fontWeight="700" color="gray.500"
              textTransform="uppercase" letterSpacing="wider" mb={1}
            >
              {label}
            </StatLabel>
            <StatNumber
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="800"
              color="gray.800"
              letterSpacing="-0.5px"
            >
              {value}
            </StatNumber>
            {helpText && (
              <StatHelpText mb={0} mt={1} fontSize="11px" color="gray.400">
                {arrowType && <StatArrow type={arrowType} />}
                {helpText}
              </StatHelpText>
            )}
            {subtext && (
              <Text fontSize="10px" color="gray.400" mt={0.5}>{subtext}</Text>
            )}
          </Stat>
          <Flex
            w={10} h={10} borderRadius="12px" bgGradient={gradient}
            align="center" justify="center" opacity={0.15} flexShrink={0}
          >
            <Icon size={20} color="black" />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  )
}`;
const statCardNew = `// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, gradient, helpText, arrowType, onClick, subtext, baseColor = '#1b2cc1' }) {
  return (
    <Card
      cursor={onClick ? 'pointer' : 'default'}
      transition="all 0.2s ease"
      _hover={{ transform: 'translateY(-2px)', shadow: '0 8px 30px rgba(9,21,64,0.08)' }}
      onClick={onClick}
      border="1px solid" borderColor="gray.100"
      shadow="sm"
      borderRadius="xl"
    >
      <CardBody p={5}>
        <Flex justify="space-between" align="flex-start">
          <Stat flex={1}>
            <StatLabel
              fontSize="11px" fontWeight="600" color="gray.500"
              mb={1}
            >
              {label}
            </StatLabel>
            <StatNumber
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="800"
              color="brand.900"
              letterSpacing="-0.5px"
            >
              {value}
            </StatNumber>
            {helpText && (
              <StatHelpText mb={0} mt={1} fontSize="12px" color="gray.400" fontWeight="500">
                {arrowType && <StatArrow type={arrowType} />}
                {helpText}
              </StatHelpText>
            )}
            {subtext && (
              <Text fontSize="11px" color="gray.400" mt={0.5} fontWeight="500">{subtext}</Text>
            )}
          </Stat>
          <Flex
            w={12} h={12} borderRadius="12px" bg={baseColor + '1A'}
            align="center" justify="center" flexShrink={0}
            color={baseColor}
          >
            <Icon size={22} />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  )
}`;
dashboard = dashboard.replace(statCardOld, statCardNew);
// The calls to StatCard might not provide `baseColor`, so let's default to primary blue in the function signature.
// Wait, Dashboard passes `gradient` which I didn't remove. Let's make sure `baseColor` receives something if we want it to be colored.
// Or we can just extract the first color from gradient if possible, but hardcoding works.
// Let's modify the Dashboard calls to include baseColor.
dashboard = dashboard.replace(
  `gradient="linear(to-r, green.500, teal.500)"`,
  `gradient="linear(to-r, green.500, teal.500)" baseColor="#10B981"`
).replace(
  `gradient="linear(to-r, plum.500, purple.500)"`,
  `gradient="linear(to-r, plum.500, purple.500)" baseColor="#1b2cc1"`
).replace(
  `gradient="linear(to-r, brand.500, pink.500)"`,
  `gradient="linear(to-r, brand.500, pink.500)" baseColor="#7692ff"`
).replace(
  `gradient="linear(to-r, blue.400, cyan.400)"`,
  `gradient="linear(to-r, blue.400, cyan.400)" baseColor="#abd2fa"`
);
fs.writeFileSync('client/src/components/Dashboard.jsx', dashboard);


// --- 2. Expenses.jsx ---
let expenses = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

const expensesCardOld = `        {[
          { label: 'Total Expenses', value: fmt(totalAmount), bg: 'brand.500' },
          { label: 'Entries', value: filtered.length, bg: 'plum.500' },
          { label: 'Avg Expense', value: filtered.length ? fmt(totalAmount / filtered.length) : '₹0', bg: 'blue.400' },
        ].map(({ label, value, bg }) => (
          <Card key={label} overflow="hidden" shadow="0 2px 10px rgba(0,0,0,0.07)">
            <Box h="3px" bg={bg} />
            <CardBody py={3} px={4}>
              <Stat>
                <StatLabel fontSize="10px" color="gray.500" fontWeight="700" textTransform="uppercase" letterSpacing="wider">{label}</StatLabel>
                <StatNumber fontSize="lg" color="gray.800" fontWeight="800">{value}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        ))}`;
const expensesCardNew = `        {[
          { label: 'Total Expenses', value: fmt(totalAmount), color: '#091540', icon: Receipt },
          { label: 'Entries', value: filtered.length, color: '#1B2CC1', icon: LayoutList },
          { label: 'Avg Expense', value: filtered.length ? fmt(totalAmount / filtered.length) : '₹0', color: '#7692FF', icon: Tag },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100">
            <CardBody py={4} px={5}>
              <Flex justify="space-between" align="center">
                <Stat>
                  <StatLabel fontSize="11px" color="gray.500" fontWeight="600" mb={1}>{label}</StatLabel>
                  <StatNumber fontSize="2xl" color="brand.900" fontWeight="800">{value}</StatNumber>
                </Stat>
                <Flex w={10} h={10} borderRadius="10px" bg={color + '1A'} color={color} align="center" justify="center">
                  <Icon size={20} />
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        ))}`;
expenses = expenses.replace(expensesCardOld, expensesCardNew);
fs.writeFileSync('client/src/components/Expenses.jsx', expenses);


// --- 3. Savings.jsx ---
let savings = fs.readFileSync('client/src/components/Savings.jsx', 'utf8');

const savingsCardOld = `        {[
          { label: 'Total Saved',      value: fmt(totalSaved),                     color: '#10B981', icon: PiggyBank },
          { label: 'Entries',          value: savings.length,                       color: '#7F55B0', icon: BarChart2 },
          { label: 'Still Required',   value: fmt(summary?.amountStillRequired),    color: '#E09913', icon: Clock     },
          { label: 'Budget Goal',      value: fmt(summary?.budget),                 color: '#0EA5E9', icon: Target    },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} border="1px solid" borderColor="gray.100" shadow="0 2px 10px rgba(0,0,0,0.05)" overflow="hidden">
            <Box h="3px" bg={color} />
            <CardBody py={3} px={4}>
              <Flex justify="space-between" align="flex-start">
                <Stat>
                  <StatLabel fontSize="10px" color="gray.500" fontWeight="700" textTransform="uppercase" letterSpacing="wider">{label}</StatLabel>
                  <StatNumber fontSize="lg" color="gray.800" fontWeight="800">{value}</StatNumber>
                </Stat>
                <Flex w={8} h={8} borderRadius="9px" align="center" justify="center" bg="gray.50" mt={1}>
                  <Icon size={15} color={color} />
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        ))}`;

const savingsCardNew = `        {[
          { label: 'Total Saved',      value: fmt(totalSaved),                     color: '#10B981', icon: PiggyBank },
          { label: 'Entries',          value: savings.length,                       color: '#1b2cc1', icon: BarChart2 },
          { label: 'Still Required',   value: fmt(summary?.amountStillRequired),    color: '#E09913', icon: Clock     },
          { label: 'Budget Goal',      value: fmt(summary?.budget),                 color: '#0EA5E9', icon: Target    },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100">
            <CardBody py={4} px={5}>
              <Flex justify="space-between" align="center">
                <Stat>
                  <StatLabel fontSize="11px" color="gray.500" fontWeight="600" mb={1}>{label}</StatLabel>
                  <StatNumber fontSize="2xl" color="brand.900" fontWeight="800">{value}</StatNumber>
                </Stat>
                <Flex w={10} h={10} borderRadius="10px" bg={color + '1A'} color={color} align="center" justify="center">
                  <Icon size={20} />
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        ))}`;
savings = savings.replace(savingsCardOld, savingsCardNew);
fs.writeFileSync('client/src/components/Savings.jsx', savings);

console.log("All cards patched successfully.");
