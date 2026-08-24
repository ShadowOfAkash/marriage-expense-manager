const fs = require('fs');
let code = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

const importReplacement = `import { Wallet, Target, Receipt, CreditCard, ChevronRight, PieChart as PieIcon, UploadCloud, Smartphone } from 'lucide-react'`;
code = code.replace(`import { Wallet, Target, Receipt, CreditCard, ChevronRight, PieChart as PieIcon, UploadCloud } from 'lucide-react'`, importReplacement);

const telegramState = `  const [telegramCode, setTelegramCode] = useState(null)
  const [generatingCode, setGeneratingCode] = useState(false)

  const handleGenerateTelegramCode = async () => {
    try {
      setGeneratingCode(true);
      const res = await api.generateTelegramCode();
      setTelegramCode(res.code);
      toast({ title: 'Code Generated', description: 'Send this code to the Telegram bot!', status: 'success' });
    } catch (e) {
      toast({ title: 'Failed to generate code', description: e.message, status: 'error' });
    } finally {
      setGeneratingCode(false);
    }
  }`;

code = code.replace("  const toast = useToast()", "  const toast = useToast()\n" + telegramState);

const actionCardsOld = `{/* Quick Action Cards */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
          <Card bg="white" cursor="pointer" onClick={() => setActiveTab('expenses')} _hover={{ transform: 'translateY(-2px)', shadow: 'md' }} transition="all 0.2s">
            <CardBody p={5}>
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={4}>
                  <Flex w="48px" h="48px" bg="brand.900" color="white" borderRadius="12px" align="center" justify="center">
                    <Receipt size={24} />
                  </Flex>
                  <Box>
                    <Text fontWeight="700" color="brand.900">Add New Expense</Text>
                    <Text fontSize="sm" color="gray.500">Log a new payment</Text>
                  </Box>
                </Flex>
                <ChevronRight size={20} color="#CBD5E1" />
              </Flex>
            </CardBody>
          </Card>
          
          <Card bg="white" cursor="pointer" onClick={() => setActiveTab('savings')} _hover={{ transform: 'translateY(-2px)', shadow: 'md' }} transition="all 0.2s">
            <CardBody p={5}>
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={4}>
                  <Flex w="48px" h="48px" bg="brand.900" color="white" borderRadius="12px" align="center" justify="center">
                    <Target size={24} />
                  </Flex>
                  <Box>
                    <Text fontWeight="700" color="brand.900">Log Saving</Text>
                    <Text fontSize="sm" color="gray.500">Record a new deposit</Text>
                  </Box>
                </Flex>
                <ChevronRight size={20} color="#CBD5E1" />
              </Flex>
            </CardBody>
          </Card>
        </SimpleGrid>`;

const actionCardsNew = `{/* Quick Action Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
          <Card bg="white" cursor="pointer" onClick={() => setActiveTab('expenses')} _hover={{ transform: 'translateY(-2px)', shadow: 'md' }} transition="all 0.2s">
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
          
          <Card bg="white" cursor="pointer" onClick={() => setActiveTab('savings')} _hover={{ transform: 'translateY(-2px)', shadow: 'md' }} transition="all 0.2s">
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

          <Card bg="white" cursor="pointer" onClick={handleGenerateTelegramCode} _hover={{ transform: 'translateY(-2px)', shadow: 'md' }} transition="all 0.2s">
            <CardBody p={5}>
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={4}>
                  <Flex w="48px" h="48px" bg="#0088cc" color="white" borderRadius="12px" align="center" justify="center">
                    <Smartphone size={24} />
                  </Flex>
                  <Box>
                    <Text fontWeight="700" color="brand.900">Connect Telegram</Text>
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
        </SimpleGrid>`;

code = code.replace(actionCardsOld, actionCardsNew);

fs.writeFileSync('client/src/components/Dashboard.jsx', code);
console.log('Dashboard patched for telegram!');
