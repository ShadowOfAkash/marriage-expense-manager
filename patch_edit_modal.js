const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

const oldEditStack = `<VStack spacing={4}>
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
              </VStack>`;

const newEditGrid = `<SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
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
              </SimpleGrid>`;

code = code.replace(oldEditStack, newEditGrid);
fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log('Edit Modal changed to 2-column SimpleGrid!');
