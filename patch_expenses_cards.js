const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

const oldBlock = `        {[
          { label: 'Total Entries',   value: expenses.length,    bg: '#7F55B0' },
          { label: 'Total Spent',     value: fmt(totalAll),      bg: '#BE185D' },
          { label: 'Filtered Items',  value: filtered.length,    bg: '#E09913' },
          { label: 'Filtered Total',  value: fmt(filteredTotal), bg: '#0EA5E9' },
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

const newBlock = `        {[
          { label: 'Total Entries',   value: expenses.length,    color: '#091540', icon: LayoutList },
          { label: 'Total Spent',     value: fmt(totalAll),      color: '#1B2CC1', icon: Receipt },
          { label: 'Filtered Items',  value: filtered.length,    color: '#7692FF', icon: FilterX },
          { label: 'Filtered Total',  value: fmt(filteredTotal), color: '#ABD2FA', icon: Tag },
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

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Patched Expenses.jsx cards!");
