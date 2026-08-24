const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

// 1. Import Check icon
code = code.replace(
  "Calendar, Tag, AlignLeft, FilterX, LayoutList, Camera",
  "Calendar, Tag, AlignLeft, FilterX, LayoutList, Camera, Check"
);

// 2. Add handleApprove function
code = code.replace(
  "const handleAdd = async () => {",
  `const handleApprove = async (exp) => {
    try {
      await api.updateExpense(exp.id, { ...exp, status: 'approved' });
      toast({ title: 'Expense Approved', status: 'success', duration: 2000 });
      load();
    } catch {
      toast({ title: 'Error approving', status: 'error', duration: 3000 });
    }
  };

  const handleAdd = async () => {`
);

// 3. Sort filtered to put drafts at the top
code = code.replace(
  "const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0)",
  `filtered.sort((a, b) => {
    if (a.status === 'draft' && b.status !== 'draft') return -1;
    if (a.status !== 'draft' && b.status === 'draft') return 1;
    return 0;
  });
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0)`
);

// 4. Update Tr mapping to style drafts and add Approve button
const oldTr = `{filtered.map((e, i) => (
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
                ))}`;

const newTr = `{filtered.map((e, i) => {
                  const isDraft = e.status === 'draft';
                  return (
                    <Tr key={e.id} bg={isDraft ? 'orange.50' : 'transparent'} _hover={{ bg: isDraft ? 'orange.100' : 'gray.50' }} transition="background 0.12s">
                      <Td fontSize="11px" color="gray.400" borderColor={isDraft ? 'orange.100' : 'gray.50'} w={8}>{i + 1}</Td>
                      <Td fontSize="xs" color="gray.500" borderColor={isDraft ? 'orange.100' : 'gray.50'} whiteSpace="nowrap">{formatDate(e.date)}</Td>
                      <Td borderColor={isDraft ? 'orange.100' : 'gray.50'}>
                        <Badge
                          bg={isDraft ? 'orange.100' : 'brand.50'} color={isDraft ? 'orange.800' : 'brand.700'} fontSize="10px"
                          border="1px solid" borderColor={isDraft ? 'orange.200' : 'brand.100'}
                          borderRadius="6px" px={2} py={0.5} fontWeight="600"
                        >
                          {e.category}
                        </Badge>
                      </Td>
                      <Td fontSize="sm" color="gray.700" maxW="220px" borderColor={isDraft ? 'orange.100' : 'gray.50'}>
                        <HStack>
                          {isDraft && <Badge colorScheme="orange" fontSize="9px" borderRadius="4px">DRAFT</Badge>}
                          <Text noOfLines={1}>{e.description || <Text as="span" color="gray.300">—</Text>}</Text>
                        </HStack>
                      </Td>
                      <Td isNumeric fontWeight="700" color="gray.800" borderColor={isDraft ? 'orange.100' : 'gray.50'}>{fmt(e.amount)}</Td>
                      <Td borderColor={isDraft ? 'orange.100' : 'gray.50'}>
                        <HStack spacing={1}>
                          {isDraft && (
                            <Button size="xs" colorScheme="orange" leftIcon={<Check size={11} />}
                              onClick={() => handleApprove(e)} borderRadius="7px" fontSize="10px">Approve</Button>
                          )}
                          <Button size="xs" variant="ghost" colorScheme="blue" leftIcon={<Pencil size={11} />}
                            onClick={() => openEdit(e)} borderRadius="7px" fontSize="10px">Edit</Button>
                          <Button size="xs" variant="ghost" colorScheme="red"  leftIcon={<Trash2 size={11} />}
                            onClick={() => confirmDelete(e.id)} borderRadius="7px" fontSize="10px">Del</Button>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}`;

code = code.replace(oldTr, newTr);

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Expenses.jsx patched successfully.");
