const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

// Add Image to lucide-react imports if not there
code = code.replace(
  "Calendar, Tag, AlignLeft, FilterX, LayoutList, Camera, Check",
  "Calendar, Tag, AlignLeft, FilterX, LayoutList, Camera, Check, Image as ImageIcon"
);

// Add receipt_url to EMPTY_FORM
code = code.replace(
  "const EMPTY_FORM = { category: '', description: '', amount: '', date: today() };",
  "const EMPTY_FORM = { category: '', description: '', amount: '', date: today(), receipt_url: '' };"
);

// Update setForm in handleScan
code = code.replace(
  "setForm({ ...EMPTY_FORM, ...result, date: result.date || today() });",
  "setForm({ ...EMPTY_FORM, ...result, date: result.date || today(), receipt_url: result.receipt_url || '' });"
);

// Update table rows to show the image button
const targetHStack = `<HStack>\n                          {isDraft && <Badge colorScheme="orange" fontSize="9px" borderRadius="4px">DRAFT</Badge>}\n                          <Text noOfLines={1}>{e.description || <Text as="span" color="gray.300">—</Text>}</Text>\n                        </HStack>`;
const replacementHStack = `<HStack>\n                          {isDraft && <Badge colorScheme="orange" fontSize="9px" borderRadius="4px">DRAFT</Badge>}\n                          <Text noOfLines={1}>{e.description || <Text as="span" color="gray.300">—</Text>}</Text>\n                          {e.receipt_url && (\n                            <Button size="xs" variant="ghost" colorScheme="purple" p={1} h="auto" onClick={() => window.open(e.receipt_url, '_blank')} title="View Receipt">\n                              <ImageIcon size={14} />\n                            </Button>\n                          )}\n                        </HStack>`;

code = code.replace(targetHStack, replacementHStack);

// Update the Form UI to show a thumbnail if receipt_url exists
const targetFormBtn = `onClick={handleScan}\n                isLoading={isScanning}`;
const replacementFormBtn = `onClick={handleScan}\n                isLoading={isScanning}\n              >\n                Scan Receipt 📸\n              </Button>\n              {form.receipt_url && (\n                <Button size="sm" variant="outline" colorScheme="purple" borderRadius="10px" onClick={() => window.open(form.receipt_url, '_blank')} leftIcon={<ImageIcon size={14} />}>\n                  View Scanned Receipt\n                </Button>\n              )}\n              <Button\n                display="none"`;

// Wait, the Button structure is:
/*
<Button
  colorScheme="brand"
  variant="outline"
  borderRadius="10px"
  fontSize="sm"
  onClick={handleScan}
  isLoading={isScanning}
>
  Scan Receipt 📸
</Button>
*/
// It's safer to just replace "Scan Receipt 📸\n              </Button>"

code = code.replace(
  "Scan Receipt 📸\n              </Button>",
  `Scan Receipt 📸\n              </Button>\n              {form.receipt_url && (\n                <Button size="sm" variant="outline" colorScheme="purple" borderRadius="10px" onClick={() => window.open(form.receipt_url, '_blank')} leftIcon={<ImageIcon size={14} />}>\n                  View Attached Receipt\n                </Button>\n              )}`
);


fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Expenses.jsx patched for receipt images.");
