const fs = require('fs');

// --- 1. Dashboard.jsx ---
let dashboard = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

const dashboardHeaderOld = `function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
      <HStack spacing={3}>
        <Flex
          w={9} h={9} borderRadius="10px"
          bgGradient="linear(135deg, brand.50, plum.50)"
          border="1px solid" borderColor="brand.100"
          align="center" justify="center"
        >
          <Icon size={16} color="#BE185D" />
        </Flex>
        <Box>
          <Text fontWeight="700" fontSize="md" color="gray.800">{title}</Text>
          {subtitle && <Text fontSize="11px" color="gray.400">{subtitle}</Text>}
        </Box>
      </HStack>
      {action}
    </Flex>
  )
}`;

const dashboardHeaderNew = `function SectionHeader({ icon: Icon, title, subtitle, action, color = '#1B2CC1' }) {
  return (
    <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
      <HStack spacing={3}>
        <Flex
          w={10} h={10} borderRadius="10px"
          bg={color + '1A'}
          border="1px solid" borderColor={color + '33'}
          align="center" justify="center"
        >
          <Icon size={18} color={color} />
        </Flex>
        <Box>
          <Text fontWeight="700" fontSize="md" color="gray.800">{title}</Text>
          {subtitle && <Text fontSize="12px" color="gray.500" fontWeight="500">{subtitle}</Text>}
        </Box>
      </HStack>
      {action}
    </Flex>
  )
}`;

dashboard = dashboard.replace(dashboardHeaderOld, dashboardHeaderNew);

// Replace CalendarDays with Receipt in Recent Expenses section
dashboard = dashboard.replace(
  `icon={CalendarDays}\n            title="Recent Expenses"`,
  `icon={Receipt}\n            title="Recent Expenses"`
);

// If PieIcon is PieChart (we use PieIcon as an alias in lucide-react if imported as 'PieChart as PieIcon', let's check).
// Just to be sure, I will leave it as is if it's already working.

fs.writeFileSync('client/src/components/Dashboard.jsx', dashboard);


// --- 2. Savings.jsx ---
let savings = fs.readFileSync('client/src/components/Savings.jsx', 'utf8');

const savingsHeaderOld = `function SectionHeader({ icon: Icon, title, subtitle, color = '#10B981' }) {
  return (
    <Flex align="center" gap={3} mb={5}>
      <Flex w={9} h={9} borderRadius="10px"
        bg="green.50" border="1px solid" borderColor="green.100"
        align="center" justify="center" flexShrink={0}
      >
        <Icon size={16} color={color} />
      </Flex>
      <Box>
        <Text fontWeight="700" fontSize="md" color="gray.800">{title}</Text>
        {subtitle && <Text fontSize="11px" color="gray.400">{subtitle}</Text>}
      </Box>
    </Flex>
  )
}`;

const savingsHeaderNew = `function SectionHeader({ icon: Icon, title, subtitle, color = '#1B2CC1' }) {
  return (
    <Flex align="center" gap={3} mb={5}>
      <Flex w={10} h={10} borderRadius="10px"
        bg={color + '1A'} border="1px solid" borderColor={color + '33'}
        align="center" justify="center" flexShrink={0}
      >
        <Icon size={18} color={color} />
      </Flex>
      <Box>
        <Text fontWeight="700" fontSize="md" color="gray.800">{title}</Text>
        {subtitle && <Text fontSize="12px" color="gray.500" fontWeight="500">{subtitle}</Text>}
      </Box>
    </Flex>
  )
}`;

savings = savings.replace(savingsHeaderOld, savingsHeaderNew);
fs.writeFileSync('client/src/components/Savings.jsx', savings);


console.log("Section headers patched.");
