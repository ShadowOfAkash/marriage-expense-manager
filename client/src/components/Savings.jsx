import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Container, Card, CardBody, Heading, Text,
  SimpleGrid, FormControl, FormLabel, Input, Select, Button,
  Table, Thead, Tbody, Tr, Th, Td, Badge, Flex, HStack, VStack,
  useToast, useDisclosure, Spinner, Center, Stat, StatLabel,
  StatNumber, InputGroup, InputLeftAddon, Progress, Divider,
  AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
} from '@chakra-ui/react'
import {
  PiggyBank, Plus, Trash2, IndianRupee, CalendarDays,
  StickyNote, TrendingUp, Target, Clock, BarChart2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { api, fmt, fmtK, MONTH_NAMES } from '../utils/api'

const MONTHS = MONTH_NAMES

function SectionHeader({ icon: Icon, title, subtitle, color = '#1B2CC1' }) {
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
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" p={3}
      shadow="0 8px 24px rgba(0,0,0,0.12)" fontSize="sm">
      <Text fontWeight="700" color="gray.700" mb={1} fontSize="xs">{label}</Text>
      <Flex align="center" gap={2}>
        <Box w={2} h={2} borderRadius="full" bg={payload[0]?.color} />
        <Text fontSize="xs" color="gray.500">Savings:</Text>
        <Text fontSize="xs" fontWeight="700" color="gray.800">{fmt(payload[0]?.value)}</Text>
      </Flex>
    </Box>
  )
}

export default function Savings() {
  const [savings, setSavings] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [delId,   setDelId]   = useState(null)
  const [form,    setForm]    = useState({ month: currentMonth(), year: currentYear(), amount: '', note: '' })

  const { isOpen: isDelOpen, onOpen: onDelOpen, onClose: onDelClose } = useDisclosure()
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure()
  const cancelRef = React.useRef()
  const toast = useToast()

  function currentMonth() { return MONTHS[new Date().getMonth()] }
  function currentYear()  { return new Date().getFullYear() }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [sav, sum] = await Promise.all([api.getSavings(), api.getSummary()])
      setSavings(sav); setSummary(sum)
    } catch {
      toast({ title: 'Error loading data', status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!form.month) return toast({ title: 'Select a month', status: 'warning', duration: 2000 })
    if (!form.year)  return toast({ title: 'Enter a year',   status: 'warning', duration: 2000 })
    if (!form.amount || Number(form.amount) <= 0)
      return toast({ title: 'Enter a valid amount', status: 'warning', duration: 2000 })
    setSaving(true)
    try {
      await api.addSavings({ ...form, amount: Number(form.amount), year: Number(form.year) })
      toast({ title: 'Savings logged!', status: 'success', duration: 2000 })
      setForm({ month: currentMonth(), year: currentYear(), amount: '', note: '' })
      onAddClose()
      load()
    } catch {
      toast({ title: 'Error saving entry', status: 'error', duration: 3000 })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (id) => { setDelId(id); onDelOpen() }
  const handleDelete = async () => {
    try {
      await api.deleteSavings(delId)
      toast({ title: 'Entry deleted', status: 'info', duration: 2000 })
      onDelClose(); load()
    } catch {
      toast({ title: 'Error deleting', status: 'error', duration: 3000 })
    }
  }

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const totalSaved = savings.reduce((s, e) => s + e.amount, 0)

  const chartData = [...savings]
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
    })
    .map(s => ({ name: `${s.month.slice(0,3)} '${String(s.year).slice(2)}`, amount: s.amount }))

  const sp = (summary?.savingsProgress || 0).toFixed(1)

  return (
    <Container maxW="7xl" py={7} px={{ base: 4, md: 6 }}>
      <Flex align="flex-start" justify="space-between" mb={7} flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="-0.5px">Savings</Heading>
          <Text color="gray.400" fontSize="sm" mt={0.5}>Track your monthly salary and savings</Text>
        </Box>
        <Button size="md" colorScheme="brand" leftIcon={<Plus size={16} />} onClick={onAddOpen} shadow="md">
          Add Saving
        </Button>
      </Flex>

      {/* ── Add Saving Modal ── */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="xl">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent borderRadius="20px" overflow="hidden" shadow="0 24px 64px rgba(0,0,0,0.25)">
          <Box h="3px" bgGradient="linear(to-r, brand.400, brand.600)" />
          <ModalHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
            <HStack spacing={2}><Plus size={16} color="#1B2CC1" /><Text>Log Saving</Text></HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
          
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={5}>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                <HStack spacing={1.5} mb={1}><CalendarDays size={12} /><Text>Month</Text></HStack>
              </FormLabel>
              <Select
                value={form.month}
                onChange={e => setF('month', e.target.value)}
                focusBorderColor="green.500"
                borderColor="gray.200"
                borderRadius="10px"
                bg="gray.50"
                _hover={{ borderColor: 'green.300', bg: 'white' }}
                _focus={{ bg: 'white' }}
                fontSize="sm"
              >
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                <HStack spacing={1.5} mb={1}><CalendarDays size={12} /><Text>Year</Text></HStack>
              </FormLabel>
              <Input
                type="number"
                value={form.year}
                onChange={e => setF('year', e.target.value)}
                min={2020} max={2035}
                focusBorderColor="green.500"
                borderColor="gray.200"
                borderRadius="10px"
                bg="gray.50"
                _hover={{ borderColor: 'green.300', bg: 'white' }}
                _focus={{ bg: 'white' }}
                fontSize="sm"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                <HStack spacing={1.5} mb={1}><IndianRupee size={12} /><Text>Amount Saved</Text></HStack>
              </FormLabel>
              <InputGroup>
                <InputLeftAddon bg="green.50" color="green.700" fontWeight="700" borderRadius="10px 0 0 10px" fontSize="sm">₹</InputLeftAddon>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setF('amount', e.target.value)}
                  placeholder="0"
                  focusBorderColor="green.500"
                  borderColor="gray.200"
                  borderRadius="0 10px 10px 0"
                  bg="gray.50"
                  _hover={{ borderColor: 'green.300', bg: 'white' }}
                  _focus={{ bg: 'white' }}
                  min={0}
                  fontSize="sm"
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                <HStack spacing={1.5} mb={1}><StickyNote size={12} /><Text>Note</Text></HStack>
              </FormLabel>
              <Input
                value={form.note}
                onChange={e => setF('note', e.target.value)}
                placeholder="e.g. Salary + bonus"
                focusBorderColor="green.500"
                borderColor="gray.200"
                borderRadius="10px"
                bg="gray.50"
                _hover={{ borderColor: 'green.300', bg: 'white' }}
                _focus={{ bg: 'white' }}
                fontSize="sm"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </FormControl>
          </SimpleGrid>

          <HStack mt={5}>
            <Button
              bg="linear-gradient(135deg, #10B981, #059669)"
              color="white" fontWeight="700"
              _hover={{ bg: 'linear-gradient(135deg, #059669, #047857)', transform: 'translateY(-1px)', shadow: 'md' }}
              _active={{ transform: 'translateY(0)' }}
              leftIcon={<Plus size={15} />}
              onClick={handleAdd}
              isLoading={saving}
              loadingText="Saving…"
              borderRadius="10px"
              transition="all 0.2s"
              shadow="0 4px 12px rgba(16,185,129,0.25)"
            >
              Save Entry
            </Button>
            <Button
              variant="ghost" colorScheme="gray" borderRadius="10px"
              onClick={() => setForm({ month: currentMonth(), year: currentYear(), amount: '', note: '' })}
              fontSize="sm"
            >
              Clear
            </Button>
          </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Summary Cards ── */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={5}>
        {[
          { label: 'Total Saved',      value: fmtK(totalSaved),                     color: '#10B981', icon: PiggyBank },
          { label: 'Entries',          value: savings.length,                       color: '#1B2CC1', icon: BarChart2 },
          { label: 'Still Required',   value: fmtK(summary?.amountStillRequired),    color: '#E09913', icon: Clock     },
          { label: 'Budget Goal',      value: fmtK(summary?.budget),                 color: '#0EA5E9', icon: Target    },
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
        ))}
      </SimpleGrid>

      {/* ── Savings Goal Progress ── */}
      {(summary?.budget || 0) > 0 && (
        <Card mb={5} border="1px solid" borderColor="green.100" shadow="0 2px 10px rgba(0,0,0,0.05)">
          <CardBody p={6}>
            <Flex justify="space-between" align="center" mb={3}>
              <HStack spacing={2}>
                <TrendingUp size={16} color="#10B981" />
                <Text fontWeight="700" fontSize="sm" color="gray.700">Savings Goal Progress</Text>
              </HStack>
              <Badge
                bg="green.50" color="green.700" border="1px solid" borderColor="green.200"
                borderRadius="8px" px={3} py={1} fontSize="12px" fontWeight="700"
              >
                {sp}% of {fmt(summary?.budget)}
              </Badge>
            </Flex>
            <Progress
              value={summary?.savingsProgress || 0}
              borderRadius="full"
              size="lg"
              sx={{ '& > div': { background: 'linear-gradient(to right, #10B981, #059669)', transition: 'width 0.8s ease' } }}
            />
            <Flex justify="space-between" mt={2} fontSize="11px" color="gray.400">
              <Text>Saved: {fmt(totalSaved)}</Text>
              <Text>Remaining: {fmt(summary?.amountStillRequired)}</Text>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* ── Monthly Bar Chart ── */}
      {chartData.length > 0 && (
        <Card mb={5} border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
          <CardBody p={6}>
            <SectionHeader icon={BarChart2} title="Monthly Savings History" subtitle="Amount saved per month" />
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F9FAFB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmtK} width={58} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Savings" radius={[7,7,0,0]} maxBarSize={44}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? '#10B981' : '#7F55B0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* ── Savings Table ── */}
      <Card border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)" overflow="hidden">
        <CardBody p={6} pt={5}>
          <Flex justify="space-between" align="center" mb={4}>
            <HStack spacing={2}>
              <PiggyBank size={16} color="#10B981" />
              <Text fontWeight="700" fontSize="md" color="gray.800">Savings History</Text>
            </HStack>
            <Badge bg="green.50" color="green.700" border="1px solid" borderColor="green.200" borderRadius="8px" px={3} py={1} fontSize="12px" fontWeight="700">
              Total: {fmt(totalSaved)}
            </Badge>
          </Flex>

          {loading ? (
            <Center py={12}><Spinner color="green.500" size="lg" /></Center>
          ) : savings.length === 0 ? (
            <Center py={12}>
              <VStack spacing={3}>
                <Flex w={14} h={14} borderRadius="16px" bg="gray.50" align="center" justify="center">
                  <PiggyBank size={24} color="#CBD5E0" />
                </Flex>
                <Text color="gray.400" fontSize="sm">No savings logged yet.</Text>
              </VStack>
            </Center>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    {['#','Month','Year','Amount Saved','Note','Action'].map(h => (
                      <Th key={h} color="gray.500" fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" borderColor="gray.100">{h}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {savings.map((s, i) => (
                    <Tr key={s.id} _hover={{ bg: 'gray.50' }} transition="background 0.12s">
                      <Td fontSize="11px" color="gray.400" borderColor="gray.50" w={8}>{i + 1}</Td>
                      <Td borderColor="gray.50">
                        <Badge bg="green.50" color="green.700" border="1px solid" borderColor="green.100" borderRadius="6px" px={2} py={0.5} fontSize="10px" fontWeight="600">
                          {s.month}
                        </Badge>
                      </Td>
                      <Td fontSize="sm" color="gray.600" borderColor="gray.50">{s.year}</Td>
                      <Td fontWeight="700" color="green.700" borderColor="gray.50">{fmt(s.amount)}</Td>
                      <Td fontSize="sm" color="gray.600" maxW="220px" borderColor="gray.50">
                        <Text noOfLines={1}>{s.note || <Text as="span" color="gray.300">—</Text>}</Text>
                      </Td>
                      <Td borderColor="gray.50">
                        <Button size="xs" variant="ghost" colorScheme="red" leftIcon={<Trash2 size={11} />}
                          onClick={() => confirmDelete(s.id)} borderRadius="7px" fontSize="10px">Del</Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* ── Delete Confirm ── */}
      <AlertDialog isOpen={isDelOpen} leastDestructiveRef={cancelRef} onClose={onDelClose} isCentered>
        <AlertDialogOverlay backdropFilter="blur(6px)">
          <AlertDialogContent borderRadius="18px" shadow="0 24px 64px rgba(0,0,0,0.25)">
            <AlertDialogHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
              <HStack spacing={2}><Trash2 size={16} color="#EF4444" /><Text>Delete Entry?</Text></HStack>
            </AlertDialogHeader>
            <AlertDialogBody color="gray.600" fontSize="sm">This action cannot be undone.</AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={onDelClose} variant="ghost" borderRadius="10px">Cancel</Button>
              <Button colorScheme="red" onClick={handleDelete} borderRadius="10px" leftIcon={<Trash2 size={13} />}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
}
