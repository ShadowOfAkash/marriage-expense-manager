import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Container, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  Card, CardBody, CardHeader, Heading, Text, Progress, Badge, Flex, VStack, HStack,
  Table, Thead, Tbody, Tr, Th, Td, Button, useToast, Spinner, Center,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Input, InputGroup, InputLeftAddon, useDisclosure, Divider,
} from '@chakra-ui/react'
import {
  Target, TrendingUp, Wallet, Clock, AlertCircle,
  PieChart as PieIcon, BarChart2, Activity, CalendarDays, Receipt, PiggyBank,
  ChevronRight, IndianRupee,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar,
  RadialBarChart, RadialBar,
} from 'recharts'
import { api, fmt, fmtK, formatDate, MONTH_NAMES } from '../utils/api'

const CAT_COLORS = [
  '#BE185D','#7F55B0','#E09913','#0EA5E9','#10B981',
  '#F43F5E','#8B5CF6','#F59E0B','#06B6D4','#22C55E',
  '#EC4899','#A78BFA','#FBBF24','#38BDF8','#4ADE80',
]

// ── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Box
      bg="white" border="1px solid" borderColor="gray.100"
      borderRadius="12px" p={3} shadow="0 8px 24px rgba(0,0,0,0.12)"
      fontSize="sm" minW="160px"
    >
      <Text fontWeight="700" color="gray.700" mb={2} fontSize="xs">{label}</Text>
      {payload.map((p, i) => (
        <Flex key={i} align="center" justify="space-between" gap={4}>
          <HStack spacing={2}>
            <Box w={2} h={2} borderRadius="full" bg={p.color} flexShrink={0} />
            <Text color="gray.500" fontSize="xs">{p.name}</Text>
          </HStack>
          <Text fontWeight="700" color="gray.800" fontSize="xs">{fmt(p.value)}</Text>
        </Flex>
      ))}
    </Box>
  )
}

// ── Stat Card ───────────────────────────────────────────────────────────────
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
}

// ── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, action, color = '#1B2CC1' }) {
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
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message, actionLabel, onAction }) {
  return (
    <Center h={200}>
      <VStack spacing={3}>
        <Flex w={14} h={14} borderRadius="16px" bg="gray.50" align="center" justify="center">
          <Icon size={24} color="#CBD5E0" />
        </Flex>
        <Text color="gray.400" fontSize="sm" textAlign="center">{message}</Text>
        {actionLabel && (
          <Button size="xs" colorScheme="brand" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </VStack>
    </Center>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ setActiveTab }) {
  const [summary,    setSummary]    = useState(null)
  const [expenses,   setExpenses]   = useState([])
  const [savings,    setSavings]    = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [budget,     setBudget]     = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [sum, exp, sav, cats] = await Promise.all([
        api.getSummary(), api.getExpenses(), api.getSavings(), api.getCategories(),
      ])
      setSummary(sum); setExpenses(exp); setSavings(sav); setCategories(cats)
      setBudget(sum.budget || '')
    } catch {
      toast({ title: 'Error loading data', status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleSaveBudget = async () => {
    try {
      await api.saveBudget(Number(budget))
      toast({ title: 'Budget goal saved!', status: 'success', duration: 2000 })
      onClose(); loadAll()
    } catch {
      toast({ title: 'Error saving budget', status: 'error', duration: 3000 })
    }
  }

  // Chart data
  const savingsTrend = useMemo(() => {
    const sorted = [...savings].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month)
    })
    let cum = 0
    return sorted.map(s => {
      cum += s.amount
      return { name: `${s.month.slice(0,3)} '${String(s.year).slice(2)}`, monthly: s.amount, cumulative: cum }
    })
  }, [savings])

  const monthlyComparison = useMemo(() => {
    const map = {}
    const key = (yr, mo) => `${MONTH_NAMES[mo].slice(0,3)} '${String(yr).slice(2)}`
    const sort = (yr, mo) => yr * 12 + mo
    savings.forEach(s => {
      const mo = MONTH_NAMES.indexOf(s.month)
      const k  = key(s.year, mo)
      if (!map[k]) map[k] = { name: k, savings: 0, expenses: 0, _sort: sort(s.year, mo) }
      map[k].savings += s.amount
    })
    expenses.forEach(e => {
      const d = new Date(e.date)
      const k = key(d.getFullYear(), d.getMonth())
      if (!map[k]) map[k] = { name: k, savings: 0, expenses: 0, _sort: sort(d.getFullYear(), d.getMonth()) }
      map[k].expenses += e.amount
    })
    return Object.values(map).sort((a, b) => a._sort - b._sort)
  }, [savings, expenses])

  const pieData = useMemo(
    () => categories.map(c => ({ name: c.category, value: c.total })),
    [categories]
  )

  const radialData = useMemo(() => [
    { name: 'Expenses', value: Math.round(summary?.expenseProgress || 0), fill: '#BE185D' },
    { name: 'Savings',  value: Math.round(summary?.savingsProgress  || 0), fill: '#7F55B0' },
  ], [summary])

  if (loading) {
    return (
      <Center h="70vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.600" thickness="3px" speed="0.7s" />
          <Text color="gray.500" fontSize="sm" fontWeight="500">Loading your wedding dashboard…</Text>
        </VStack>
      </Center>
    )
  }

  const sp = (summary?.savingsProgress || 0).toFixed(1)
  const ep = (summary?.expenseProgress || 0).toFixed(1)

  return (
    <Container maxW="7xl" py={7} px={{ base: 4, md: 6 }}>

      {/* ── Page header ── */}
      <Flex justify="space-between" align="flex-start" mb={7} flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="-0.5px">
            Overview
          </Heading>
          <Text color="gray.400" fontSize="sm" mt={0.5}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </Box>
        <Button
          size="sm"
          bgGradient="linear(135deg, brand.600, plum.600)"
          color="white"
          leftIcon={<Target size={14} />}
          onClick={onOpen}
          _hover={{ bgGradient: 'linear(135deg, brand.700, plum.700)', transform: 'translateY(-1px)' }}
          borderRadius="10px"
          shadow="0 4px 12px rgba(190,24,93,0.25)"
          transition="all 0.2s"
        >
          Set Budget Goal
        </Button>
      </Flex>

      {/* ── Budget Modal ── */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(6px)" />
        <ModalContent borderRadius="20px" overflow="hidden" shadow="0 24px 64px rgba(0,0,0,0.3)">
          <Box h="3px" bgGradient="linear(to-r, brand.500, plum.500, gold.500)" />
          <ModalHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
            <HStack spacing={2}>
              <Target size={18} color="#BE185D" />
              <Text>Set Total Budget Goal</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={3} fontSize="sm" color="gray.500">
              Enter the total amount planned for your wedding
            </Text>
            <InputGroup>
              <InputLeftAddon bg="brand.50" color="brand.700" fontWeight="700" borderRadius="10px 0 0 10px">₹</InputLeftAddon>
              <Input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. 2000000"
                focusBorderColor="brand.500"
                borderRadius="0 10px 10px 0"
                h="44px"
                onKeyDown={e => e.key === 'Enter' && handleSaveBudget()}
              />
            </InputGroup>
            <Button
              mt={4} w="100%"
              bgGradient="linear(135deg, brand.600, plum.600)"
              color="white" fontWeight="700"
              _hover={{ bgGradient: 'linear(135deg, brand.700, plum.700)' }}
              borderRadius="12px"
              onClick={handleSaveBudget}
              leftIcon={<IndianRupee size={14} />}
            >
              Save Budget Goal
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Stat Cards ── */}
      <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} spacing={4} mb={6}>
        <StatCard
          label="Budget Goal"
          value={fmtK(summary?.budget)}
          Icon={Target}
          baseColor="#0EA5E9"
          helpText="Total target"
          onClick={onOpen}
        />
        <StatCard
          label="Total Savings"
          value={fmtK(summary?.totalSavings)}
          Icon={TrendingUp}
          baseColor="#10B981"
          helpText={`${sp}% of goal`}
          arrowType="increase"
        />
        <StatCard
          label="Total Expenses"
          value={fmtK(summary?.totalExpenses)}
          Icon={IndianRupee}
          baseColor="#1B2CC1"
          helpText={`${ep}% of goal`}
        />
        <StatCard
          label="Still Required"
          value={fmtK(summary?.amountStillRequired)}
          Icon={Clock}
          baseColor="#E09913"
          helpText="More savings needed"
        />
        <StatCard
          label="Available Balance"
          value={fmtK(Math.abs(summary?.availableBalance || 0))}
          Icon={Wallet}
          baseColor="#7F55B0"
          helpText={(summary?.availableBalance || 0) >= 0 ? 'Surplus' : 'Deficit'}
          arrowType={(summary?.availableBalance || 0) >= 0 ? 'increase' : 'decrease'}
        />
      </SimpleGrid>

      {/* ── Progress Section ── */}
      <Card mb={6} border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
        <CardBody p={6}>
          <SectionHeader icon={Activity} title="Budget Progress" subtitle="Savings and spending vs goal" />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            {/* Savings */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <HStack spacing={2}>
                  <Box w={2.5} h={2.5} borderRadius="full" bg="#10B981" />
                  <Text fontSize="sm" fontWeight="600" color="gray.700">Savings Progress</Text>
                </HStack>
                <Badge
                  bg="green.50" color="green.700"
                  border="1px solid" borderColor="green.200"
                  borderRadius="8px" px={2.5} py={0.5} fontSize="11px" fontWeight="700"
                >
                  {sp}%
                </Badge>
              </Flex>
              <Progress value={summary?.savingsProgress || 0} borderRadius="full" size="md"
                sx={{ '& > div': { background: 'linear-gradient(to right, #10B981, #059669)', transition: 'width 0.8s ease' } }} />
              <Flex justify="space-between" mt={2} fontSize="11px" color="gray.400">
                <Text>{fmt(summary?.totalSavings)} saved</Text>
                <Text>Goal: {fmt(summary?.budget)}</Text>
              </Flex>
            </Box>
            {/* Expenses */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <HStack spacing={2}>
                  <Box w={2.5} h={2.5} borderRadius="full" bg="#BE185D" />
                  <Text fontSize="sm" fontWeight="600" color="gray.700">Expenses vs Budget</Text>
                </HStack>
                <Badge
                  bg="brand.50" color="brand.700"
                  border="1px solid" borderColor="brand.200"
                  borderRadius="8px" px={2.5} py={0.5} fontSize="11px" fontWeight="700"
                >
                  {ep}%
                </Badge>
              </Flex>
              <Progress value={summary?.expenseProgress || 0} borderRadius="full" size="md"
                sx={{ '& > div': { background: 'linear-gradient(to right, #BE185D, #9B1249)', transition: 'width 0.8s ease' } }} />
              <Flex justify="space-between" mt={2} fontSize="11px" color="gray.400">
                <Text>{fmt(summary?.totalExpenses)} spent</Text>
                <Text>of {fmt(summary?.budget)}</Text>
              </Flex>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* ── Charts Row 1 ── */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={5}>
        {/* Savings Trend */}
        <Card border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
          <CardBody p={6}>
            <SectionHeader icon={TrendingUp} title="Savings Trend" subtitle="Cumulative & monthly over time" />
            {savingsTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={savingsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7F55B0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7F55B0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="monGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F7F7F7" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmtK} width={58} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                  <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#7F55B0" fill="url(#cumGrad)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="monthly"    name="Monthly"    stroke="#10B981" fill="url(#monGrad)" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={TrendingUp} message="No savings data yet" actionLabel="Log Savings →" onAction={() => setActiveTab('savings')} />
            )}
          </CardBody>
        </Card>

        {/* Category Donut */}
        <Card border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
          <CardBody p={6}>
            <SectionHeader icon={PieIcon} title="Category Breakdown" subtitle="Spending by category" />
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78}
                      paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <Box maxH="72px" overflowY="auto" mt={2}>
                  <SimpleGrid columns={2} spacing={1}>
                    {pieData.map((d, i) => (
                      <Flex key={i} align="center" gap={1.5} py={0.5}>
                        <Box w={2} h={2} borderRadius="3px" bg={CAT_COLORS[i % CAT_COLORS.length]} flexShrink={0} />
                        <Text fontSize="10px" color="gray.600" noOfLines={1} flex={1}>{d.name}</Text>
                        <Text fontSize="10px" color="gray.500" fontWeight="600" flexShrink={0}>{fmt(d.value)}</Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>
              </>
            ) : (
              <EmptyState icon={PieIcon} message="No expenses yet" actionLabel="Add Expense →" onAction={() => setActiveTab('expenses')} />
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* ── Charts Row 2: Bar + Radial ── */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5} mb={5}>
        {/* Monthly Bar (2 cols) */}
        <Card border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)" gridColumn={{ lg: 'span 2' }}>
          <CardBody p={6}>
            <SectionHeader icon={BarChart2} title="Monthly Comparison" subtitle="Savings vs expenses per month" />
            {monthlyComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlyComparison} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F7F7F7" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmtK} width={58} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                  <Bar dataKey="savings"  name="Savings"  fill="#7F55B0" radius={[6,6,0,0]} maxBarSize={32} />
                  <Bar dataKey="expenses" name="Expenses" fill="#BE185D" radius={[6,6,0,0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart2} message="Add savings and expenses to see chart" />
            )}
          </CardBody>
        </Card>

        {/* Radial Gauge */}
        <Card border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
          <CardBody p={6}>
            <SectionHeader icon={Target} title="Goal Meter" subtitle="% of budget goal" />
            <ResponsiveContainer width="100%" height={150}>
              <RadialBarChart
                cx="50%" cy="100%" innerRadius="40%" outerRadius="90%"
                data={radialData} startAngle={180} endAngle={0}
              >
                <RadialBar background={{ fill: '#F9FAFB' }} dataKey="value" cornerRadius={4} />
                <Tooltip formatter={v => `${v}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
            <Divider my={3} />
            <VStack spacing={2} align="stretch">
              <Flex justify="space-between" align="center">
                <HStack spacing={2}>
                  <Box w={2.5} h={2.5} borderRadius="full" bg="#7F55B0" />
                  <Text fontSize="xs" color="gray.600" fontWeight="600">Savings</Text>
                </HStack>
                <Text fontSize="xs" fontWeight="700" color="#7F55B0">{sp}%</Text>
              </Flex>
              <Flex justify="space-between" align="center">
                <HStack spacing={2}>
                  <Box w={2.5} h={2.5} borderRadius="full" bg="#BE185D" />
                  <Text fontSize="xs" color="gray.600" fontWeight="600">Expenses</Text>
                </HStack>
                <Text fontSize="xs" fontWeight="700" color="#BE185D">{ep}%</Text>
              </Flex>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* ── Recent Expenses ── */}
      <Card border="1px solid" borderColor="gray.100" shadow="0 2px 12px rgba(0,0,0,0.05)">
        <CardBody p={6}>
          <SectionHeader
            icon={Receipt}
            title="Recent Expenses"
            subtitle={`Last ${Math.min(expenses.length, 6)} entries`}
            action={
              <Button
                size="xs"
                variant="ghost"
                colorScheme="brand"
                rightIcon={<ChevronRight size={12} />}
                onClick={() => setActiveTab('expenses')}
                fontWeight="600"
              >
                View All
              </Button>
            }
          />
          {expenses.length > 0 ? (
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th color="gray.400" fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" borderColor="gray.100">Date</Th>
                  <Th color="gray.400" fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" borderColor="gray.100">Category</Th>
                  <Th color="gray.400" fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" borderColor="gray.100">Description</Th>
                  <Th color="gray.400" fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" borderColor="gray.100" isNumeric>Amount</Th>
                </Tr>
              </Thead>
              <Tbody>
                {expenses.slice(0, 6).map(e => (
                  <Tr key={e.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                    <Td fontSize="xs" color="gray.500" borderColor="gray.50">{formatDate(e.date)}</Td>
                    <Td borderColor="gray.50">
                      <Badge
                        bg="brand.50" color="brand.700" fontSize="10px"
                        border="1px solid" borderColor="brand.100"
                        borderRadius="6px" px={2} py={0.5}
                      >
                        {e.category}
                      </Badge>
                    </Td>
                    <Td fontSize="sm" color="gray.700" maxW="180px" borderColor="gray.50">
                      <Text noOfLines={1}>{e.description || <Text as="span" color="gray.300">—</Text>}</Text>
                    </Td>
                    <Td isNumeric fontWeight="700" color="gray.800" fontSize="sm" borderColor="gray.50">
                      {fmt(e.amount)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <EmptyState icon={IndianRupee} message="No expenses logged yet" actionLabel="Add First Expense →" onAction={() => setActiveTab('expenses')} />
          )}
        </CardBody>
      </Card>

    </Container>
  )
}
