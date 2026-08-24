import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Container, Card, CardBody, Heading, Text,
  SimpleGrid, FormControl, FormLabel, Input, Select, Button,
  Table, Thead, Tbody, Tr, Th, Td, Badge, Flex, HStack, VStack,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, useDisclosure, useToast,
  InputGroup, InputLeftAddon, AlertDialog, AlertDialogOverlay,
  AlertDialogContent, AlertDialogHeader, AlertDialogBody,
  AlertDialogFooter, Spinner, Center, Stat, StatLabel, StatNumber,
} from '@chakra-ui/react'
import {
  Receipt, Plus, Search, Pencil, Trash2, IndianRupee,
  Calendar, Tag, AlignLeft, FilterX, LayoutList,
} from 'lucide-react'
import { api, fmt, formatDate, CATEGORIES } from '../utils/api'

const EMPTY_FORM = { category: '', description: '', amount: '', date: '' }

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <Flex align="center" gap={3} mb={5}>
      <Flex w={9} h={9} borderRadius="10px"
        bg="brand.50" border="1px solid" borderColor="brand.100"
        align="center" justify="center" flexShrink={0}
      >
        <Icon size={16} color="#BE185D" />
      </Flex>
      <Box>
        <Text fontWeight="700" fontSize="md" color="gray.800">{title}</Text>
        {subtitle && <Text fontSize="11px" color="gray.400">{subtitle}</Text>}
      </Box>
    </Flex>
  )
}

export default function Expenses() {
  const [expenses,  setExpenses]  = useState([])
  const [form,      setForm]      = useState({ ...EMPTY_FORM, date: today() })
  const [editItem,  setEditItem]  = useState(null)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [loading,   setLoading]   = useState(true)
  const [delId,     setDelId]     = useState(null)
  const [saving,    setSaving]    = useState(false)

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDelOpen,  onOpen: onDelOpen,  onClose: onDelClose  } = useDisclosure()
  const cancelRef = React.useRef()
  const toast = useToast()

  function today() { return new Date().toISOString().split('T')[0] }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setExpenses(await api.getExpenses())
    } catch {
      toast({ title: 'Error loading expenses', status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = expenses.filter(e => {
    const matchCat = !catFilter || e.category === catFilter
    const q = search.toLowerCase()
    return matchCat && (!q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
  })
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0)

  const handleAdd = async () => {
    if (!form.category) return toast({ title: 'Select a category', status: 'warning', duration: 2000 })
    if (!form.amount || Number(form.amount) <= 0) return toast({ title: 'Enter a valid amount', status: 'warning', duration: 2000 })
    if (!form.date) return toast({ title: 'Select a date', status: 'warning', duration: 2000 })
    setSaving(true)
    try {
      await api.addExpense({ ...form, amount: Number(form.amount) })
      toast({ title: 'Expense saved!', status: 'success', duration: 2000 })
      setForm({ ...EMPTY_FORM, date: today() })
      load()
    } catch {
      toast({ title: 'Error saving expense', status: 'error', duration: 3000 })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (exp) => { setEditItem({ ...exp }); onEditOpen() }

  const handleUpdate = async () => {
    if (!editItem.category || !editItem.amount || !editItem.date)
      return toast({ title: 'All fields required', status: 'warning', duration: 2000 })
    setSaving(true)
    try {
      await api.updateExpense(editItem.id, { ...editItem, amount: Number(editItem.amount) })
      toast({ title: 'Expense updated!', status: 'success', duration: 2000 })
      onEditClose(); load()
    } catch {
      toast({ title: 'Error updating', status: 'error', duration: 3000 })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (id) => { setDelId(id); onDelOpen() }
  const handleDelete = async () => {
    try {
      await api.deleteExpense(delId)
      toast({ title: 'Expense deleted', status: 'info', duration: 2000 })
      onDelClose(); load()
    } catch {
      toast({ title: 'Error deleting', status: 'error', duration: 3000 })
    }
  }

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <Container maxW="7xl" py={7} px={{ base: 4, md: 6 }}>
      <Flex align="flex-start" justify="space-between" mb={7} flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="-0.5px">Expenses</Heading>
          <Text color="gray.400" fontSize="sm" mt={0.5}>Track and manage all wedding expenses</Text>
        </Box>
      </Flex>

      {/* ── Add Form ── */}
      <Card mb={5} border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
        <CardBody p={6}>
          <SectionHeader icon={Plus} title="Add New Expense" subtitle="Log a wedding expense entry" />
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                <HStack spacing={1.5} mb={1}><Tag size={12} /><Text>Category</Text></HStack>
              </FormLabel>
              <Select
                value={form.category}
                onChange={e => setF('category', e.target.value)}
                placeholder="— Select —"
                focusBorderColor="brand.500"
                borderColor="gray.200"
                borderRadius="10px"
                bg="gray.50"
                _hover={{ borderColor: 'brand.300', bg: 'white' }}
                _focus={{ bg: 'white' }}
                fontSize="sm"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                <HStack spacing={1.5} mb={1}><IndianRupee size={12} /><Text>Amount</Text></HStack>
              </FormLabel>
              <InputGroup>
                <InputLeftAddon bg="brand.50" color="brand.700" fontWeight="700" borderRadius="10px 0 0 10px" fontSize="sm">₹</InputLeftAddon>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setF('amount', e.target.value)}
                  placeholder="0"
                  focusBorderColor="brand.500"
                  borderColor="gray.200"
                  borderRadius="0 10px 10px 0"
                  bg="gray.50"
                  _hover={{ borderColor: 'brand.300', bg: 'white' }}
                  _focus={{ bg: 'white' }}
                  min={0}
                  fontSize="sm"
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                <HStack spacing={1.5} mb={1}><Calendar size={12} /><Text>Date</Text></HStack>
              </FormLabel>
              <Input
                type="date"
                value={form.date}
                onChange={e => setF('date', e.target.value)}
                focusBorderColor="brand.500"
                borderColor="gray.200"
                borderRadius="10px"
                bg="gray.50"
                _hover={{ borderColor: 'brand.300', bg: 'white' }}
                _focus={{ bg: 'white' }}
                fontSize="sm"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                <HStack spacing={1.5} mb={1}><AlignLeft size={12} /><Text>Description</Text></HStack>
              </FormLabel>
              <Input
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                placeholder="e.g. Banquet Hall deposit"
                focusBorderColor="brand.500"
                borderColor="gray.200"
                borderRadius="10px"
                bg="gray.50"
                _hover={{ borderColor: 'brand.300', bg: 'white' }}
                _focus={{ bg: 'white' }}
                fontSize="sm"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </FormControl>
          </SimpleGrid>

          <HStack mt={5}>
            <Button
              bgGradient="linear(135deg, brand.600, plum.600)"
              color="white" fontWeight="700"
              _hover={{ bgGradient: 'linear(135deg, brand.700, plum.700)', transform: 'translateY(-1px)', shadow: 'md' }}
              _active={{ transform: 'translateY(0)' }}
              leftIcon={<Plus size={15} />}
              onClick={handleAdd}
              isLoading={saving}
              loadingText="Saving…"
              borderRadius="10px"
              transition="all 0.2s"
              shadow="0 4px 12px rgba(190,24,93,0.2)"
            >
              Save Expense
            </Button>
            <Button
              variant="ghost" colorScheme="gray" borderRadius="10px"
              onClick={() => setForm({ ...EMPTY_FORM, date: today() })}
              fontSize="sm"
            >
              Clear
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* ── Summary Strip ── */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={5}>
        {[
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
        ))}
      </SimpleGrid>

      {/* ── Filter Bar ── */}
      <Flex gap={3} mb={4} flexWrap="wrap" align="center">
        <InputGroup flex={1} minW="200px" maxW="380px">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none">
            <Search size={15} color="#9CA3AF" />
          </Box>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search description or category…"
            focusBorderColor="brand.500"
            borderColor="gray.200"
            borderRadius="10px"
            bg="white"
            pl={9}
            fontSize="sm"
            _hover={{ borderColor: 'brand.300' }}
          />
        </InputGroup>
        <Select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          maxW="210px"
          focusBorderColor="brand.500"
          borderColor="gray.200"
          borderRadius="10px"
          bg="white"
          fontSize="sm"
          _hover={{ borderColor: 'brand.300' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </Select>
        {(search || catFilter) && (
          <Button
            variant="ghost" colorScheme="gray" size="sm" borderRadius="9px"
            leftIcon={<FilterX size={14} />}
            onClick={() => { setSearch(''); setCatFilter('') }}
            fontSize="sm"
          >
            Clear filters
          </Button>
        )}
      </Flex>

      {/* ── Table ── */}
      <Card border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)" overflow="hidden">
        {loading ? (
          <Center py={16}><Spinner color="brand.500" size="lg" /></Center>
        ) : filtered.length === 0 ? (
          <Center py={16}>
            <VStack spacing={3}>
              <Flex w={14} h={14} borderRadius="16px" bg="gray.50" align="center" justify="center">
                <LayoutList size={24} color="#CBD5E0" />
              </Flex>
              <Text color="gray.400" fontSize="sm">
                {expenses.length === 0 ? 'No expenses yet. Add your first!' : 'No results match your filters.'}
              </Text>
            </VStack>
          </Center>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  {['#','Date','Category','Description','Amount','Actions'].map(h => (
                    <Th key={h} color="gray.500" fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" borderColor="gray.100" isNumeric={h === 'Amount'}>{h}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((e, i) => (
                  <Tr key={e.id} _hover={{ bg: 'gray.50' }} transition="background 0.12s">
                    <Td fontSize="11px" color="gray.400" borderColor="gray.50" w={8}>{i + 1}</Td>
                    <Td fontSize="xs" color="gray.500" borderColor="gray.50" whiteSpace="nowrap">{formatDate(e.date)}</Td>
                    <Td borderColor="gray.50">
                      <Badge
                        bg="brand.50" color="brand.700" fontSize="10px"
                        border="1px solid" borderColor="brand.100"
                        borderRadius="6px" px={2} py={0.5} fontWeight="600"
                      >
                        {e.category}
                      </Badge>
                    </Td>
                    <Td fontSize="sm" color="gray.700" maxW="220px" borderColor="gray.50">
                      <Text noOfLines={1}>{e.description || <Text as="span" color="gray.300">—</Text>}</Text>
                    </Td>
                    <Td isNumeric fontWeight="700" color="gray.800" borderColor="gray.50">{fmt(e.amount)}</Td>
                    <Td borderColor="gray.50">
                      <HStack spacing={1}>
                        <Button size="xs" variant="ghost" colorScheme="blue" leftIcon={<Pencil size={11} />}
                          onClick={() => openEdit(e)} borderRadius="7px" fontSize="10px">Edit</Button>
                        <Button size="xs" variant="ghost" colorScheme="red"  leftIcon={<Trash2 size={11} />}
                          onClick={() => confirmDelete(e.id)} borderRadius="7px" fontSize="10px">Del</Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>

      {/* ── Edit Modal ── */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent borderRadius="20px" overflow="hidden" shadow="0 24px 64px rgba(0,0,0,0.25)">
          <Box h="3px" bgGradient="linear(to-r, blue.400, plum.500)" />
          <ModalHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
            <HStack spacing={2}><Pencil size={16} color="#3B82F6" /><Text>Edit Expense</Text></HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editItem && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">Category</FormLabel>
                  <Select value={editItem.category} onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))} focusBorderColor="blue.500" borderRadius="10px">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">Amount (₹)</FormLabel>
                  <InputGroup>
                    <InputLeftAddon borderRadius="10px 0 0 10px">₹</InputLeftAddon>
                    <Input type="number" value={editItem.amount} onChange={e => setEditItem(p => ({ ...p, amount: e.target.value }))} focusBorderColor="blue.500" borderRadius="0 10px 10px 0" />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">Date</FormLabel>
                  <Input type="date" value={editItem.date} onChange={e => setEditItem(p => ({ ...p, date: e.target.value }))} focusBorderColor="blue.500" borderRadius="10px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">Description</FormLabel>
                  <Input value={editItem.description} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} focusBorderColor="blue.500" borderRadius="10px" />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onEditClose} borderRadius="10px">Cancel</Button>
            <Button colorScheme="blue" onClick={handleUpdate} isLoading={saving} borderRadius="10px" leftIcon={<Pencil size={13} />}>Update</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Delete Confirm ── */}
      <AlertDialog isOpen={isDelOpen} leastDestructiveRef={cancelRef} onClose={onDelClose} isCentered>
        <AlertDialogOverlay backdropFilter="blur(6px)">
          <AlertDialogContent borderRadius="18px" shadow="0 24px 64px rgba(0,0,0,0.25)">
            <AlertDialogHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
              <HStack spacing={2}><Trash2 size={16} color="#EF4444" /><Text>Delete Expense?</Text></HStack>
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
