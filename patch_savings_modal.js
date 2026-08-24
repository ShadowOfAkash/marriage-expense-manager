const fs = require('fs');
let code = fs.readFileSync('client/src/components/Savings.jsx', 'utf8');

// 1. Add `isAddOpen` state
code = code.replace(
  "const { isOpen: isDelOpen,  onOpen: onDelOpen,  onClose: onDelClose  } = useDisclosure()",
  "const { isOpen: isDelOpen,  onOpen: onDelOpen,  onClose: onDelClose  } = useDisclosure()\n  const { isOpen: isAddOpen,  onOpen: onAddOpen,  onClose: onAddClose  } = useDisclosure()"
);

// 2. Close modal on save
code = code.replace(
  "setForm({ month: currentMonth(), year: currentYear(), amount: '', note: '' })\n      load()",
  "setForm({ month: currentMonth(), year: currentYear(), amount: '', note: '' })\n      onAddClose()\n      load()"
);

// 3. Update the Page Header
const targetHeader = `<Flex align="flex-start" justify="space-between" mb={7} flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="-0.5px">Savings</Heading>
          <Text color="gray.400" fontSize="sm" mt={0.5}>Track your monthly salary and savings</Text>
        </Box>
      </Flex>`;
const replaceHeader = `<Flex align="flex-start" justify="space-between" mb={7} flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="-0.5px">Savings</Heading>
          <Text color="gray.400" fontSize="sm" mt={0.5}>Track your monthly salary and savings</Text>
        </Box>
        <Button size="md" colorScheme="brand" leftIcon={<Plus size={16} />} onClick={onAddOpen} shadow="md">
          Add Saving
        </Button>
      </Flex>`;
code = code.replace(targetHeader, replaceHeader);

// 4. Transform the <Card> form into a <Modal> form
const formStart = `{/* ── Add Form ── */}
      <Card mb={5} border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
        <CardBody p={6}>`;
const modalStart = `{/* ── Add Saving Modal ── */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="xl">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent borderRadius="20px" overflow="hidden" shadow="0 24px 64px rgba(0,0,0,0.25)">
          <Box h="3px" bgGradient="linear(to-r, brand.400, brand.600)" />
          <ModalHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
            <HStack spacing={2}><Plus size={16} color="#1B2CC1" /><Text>Log Saving</Text></HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>`;
code = code.replace(formStart, modalStart);

const formEnd = `</Button>
          </HStack>
        </CardBody>
      </Card>

      {/* ── Summary Cards ── */}`;
const modalEnd = `</Button>
          </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Summary Cards ── */}`;
code = code.replace(formEnd, modalEnd);

code = code.replace(
  `<SectionHeader icon={Plus} title="Log Monthly Salary / Savings" subtitle="Record savings for this month" />`,
  ``
);

fs.writeFileSync('client/src/components/Savings.jsx', code);
console.log("Savings.jsx patched for modal.");
