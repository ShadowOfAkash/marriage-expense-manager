const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

// 1. Add `isAddOpen` state
code = code.replace(
  "const { isOpen: isDelOpen,  onOpen: onDelOpen,  onClose: onDelClose  } = useDisclosure()",
  "const { isOpen: isDelOpen,  onOpen: onDelOpen,  onClose: onDelClose  } = useDisclosure()\n  const { isOpen: isAddOpen,  onOpen: onAddOpen,  onClose: onAddClose  } = useDisclosure()"
);

// 2. Change the save function to close the modal
code = code.replace(
  "setForm({ ...EMPTY_FORM, date: today() })\n      load()",
  "setForm({ ...EMPTY_FORM, date: today() })\n      onAddClose()\n      load()"
);

// 3. Update the Page Header
const targetHeader = `<Flex align="flex-start" justify="space-between" mb={7} flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="-0.5px">Expenses</Heading>
          <Text color="gray.400" fontSize="sm" mt={0.5}>Track and manage all wedding expenses</Text>
        </Box>
      </Flex>`;
const replaceHeader = `<Flex align="flex-start" justify="space-between" mb={7} flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="-0.5px">Expenses</Heading>
          <Text color="gray.400" fontSize="sm" mt={0.5}>Track and manage all wedding expenses</Text>
        </Box>
        <Button size="md" colorScheme="brand" leftIcon={<Plus size={16} />} onClick={onAddOpen} shadow="md">
          Add New Expense
        </Button>
      </Flex>`;
code = code.replace(targetHeader, replaceHeader);

// 4. Transform the <Card> form into a <Modal> form
const formStart = `{/* ── Add Form ── */}
      <Card mb={5} border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
        <CardBody p={6}>`;
const modalStart = `{/* ── Add Expense Modal ── */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="xl">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent borderRadius="20px" overflow="hidden" shadow="0 24px 64px rgba(0,0,0,0.25)">
          <Box h="3px" bgGradient="linear(to-r, brand.400, brand.600)" />
          <ModalHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
            <HStack spacing={2}><Plus size={16} color="#1B2CC1" /><Text>Add New Expense</Text></HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>`;
code = code.replace(formStart, modalStart);

code = code.replace(
  `</Button>
            )}
          </HStack>
        </CardBody>
      </Card>`,
  `</Button>
            )}
          </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>`
);

code = code.replace(
  `<SectionHeader icon={Plus} title="Add New Expense" subtitle="Log a wedding expense entry" />`,
  ``
);

// We should also wrap the Search/Filter block so it's not sticking out. Wait, the Search block is fine below the header.

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Expenses.jsx patched for modal.");
