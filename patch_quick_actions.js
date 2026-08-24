const fs = require('fs');
let code = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

const target = `</Button>
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} spacing={4} mb={6}>`;

const replaceWith = `</Button>
      </Flex>

      {/* ── Quick Actions ── */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={7}>
        <Button
          h="100px"
          bg="brand.600"
          color="white"
          _hover={{ bg: 'brand.700', transform: 'translateY(-2px)', shadow: 'xl' }}
          transition="all 0.2s"
          borderRadius="12px"
          onClick={() => setActiveTab('expenses')}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={2}
          shadow="md"
        >
          <Receipt size={24} />
          <Text fontSize="lg" fontWeight="700">Add New Expense</Text>
        </Button>

        <Button
          h="100px"
          bg="white"
          color="brand.900"
          border="1px solid"
          borderColor="gray.200"
          _hover={{ bg: 'gray.50', transform: 'translateY(-2px)', shadow: 'xl' }}
          transition="all 0.2s"
          borderRadius="12px"
          onClick={() => setActiveTab('savings')}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={2}
          shadow="sm"
        >
          <PiggyBank size={24} />
          <Text fontSize="lg" fontWeight="700">Log Saving</Text>
        </Button>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} spacing={4} mb={6}>`;

code = code.replace(target, replaceWith);

// Ensure PiggyBank is imported
if (!code.includes('PiggyBank')) {
  code = code.replace("Receipt,", "Receipt, PiggyBank,");
}

fs.writeFileSync('client/src/components/Dashboard.jsx', code);
console.log("Quick actions restored!");
