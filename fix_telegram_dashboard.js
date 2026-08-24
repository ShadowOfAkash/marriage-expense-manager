const fs = require('fs');
let code = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

const targetStr = `{/* ── Stat Cards ── */}`;
const injection = `
      {/* ── Quick Action Cards ── */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card bg="white" cursor="pointer" onClick={() => setActiveTab('expenses')} _hover={{ transform: 'translateY(-2px)', shadow: 'md' }} transition="all 0.2s" border="1px solid" borderColor="gray.100">
          <CardBody p={5}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={4}>
                <Flex w="48px" h="48px" bg="brand.900" color="white" borderRadius="12px" align="center" justify="center">
                  <Receipt size={24} />
                </Flex>
                <Box>
                  <Text fontWeight="700" color="brand.900">Add Expense</Text>
                  <Text fontSize="sm" color="gray.500">Log payment</Text>
                </Box>
              </Flex>
              <ChevronRight size={20} color="#CBD5E1" />
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg="white" cursor="pointer" onClick={() => setActiveTab('savings')} _hover={{ transform: 'translateY(-2px)', shadow: 'md' }} transition="all 0.2s" border="1px solid" borderColor="gray.100">
          <CardBody p={5}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={4}>
                <Flex w="48px" h="48px" bg="brand.900" color="white" borderRadius="12px" align="center" justify="center">
                  <Target size={24} />
                </Flex>
                <Box>
                  <Text fontWeight="700" color="brand.900">Log Saving</Text>
                  <Text fontSize="sm" color="gray.500">Record deposit</Text>
                </Box>
              </Flex>
              <ChevronRight size={20} color="#CBD5E1" />
            </Flex>
          </CardBody>
        </Card>

        <Card bg="white" cursor="pointer" onClick={handleGenerateTelegramCode} _hover={{ transform: 'translateY(-2px)', shadow: 'md' }} transition="all 0.2s" border="1px solid" borderColor="blue.100">
          <CardBody p={5}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={4}>
                <Flex w="48px" h="48px" bg="#0088cc" color="white" borderRadius="12px" align="center" justify="center">
                  <Smartphone size={24} />
                </Flex>
                <Box>
                  <Text fontWeight="700" color="blue.700">Connect Telegram</Text>
                  {telegramCode ? (
                     <Text fontSize="xs" fontWeight="bold" color="blue.500">Code: {telegramCode}</Text>
                  ) : (
                     <Text fontSize="sm" color="gray.500">{generatingCode ? 'Loading...' : 'Link your account'}</Text>
                  )}
                </Box>
              </Flex>
              <ChevronRight size={20} color="#CBD5E1" />
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* ── Stat Cards ── */}`;

if (!code.includes('Connect Telegram')) {
  code = code.replace(targetStr, injection);
  fs.writeFileSync('client/src/components/Dashboard.jsx', code);
  console.log('Successfully injected Connect Telegram button!');
} else {
  console.log('Connect Telegram already exists in the file somehow.');
}
