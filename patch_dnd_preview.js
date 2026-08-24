const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

const oldDndContent = `<Flex direction="column" align="center" gap={3}>
              <Camera size={32} color="#1B2CC1" />
              <Text fontWeight="700" color="brand.900" fontSize="md">Drag & Drop Receipt (Image/PDF)</Text>
              <Text fontSize="sm" color="gray.500">or click to browse your files</Text>
              {scanning && <Text fontSize="sm" color="purple.500" fontWeight="bold" mt={2}>Analyzing with AI...</Text>}
            </Flex>`;

const newDndContent = `<Flex direction="column" align="center" gap={3}>
              {form.receipt_url ? (
                <>
                  <ImageIcon size={32} color="#10B981" />
                  <Text fontWeight="700" color="green.600" fontSize="md">Document Uploaded Successfully!</Text>
                  <Text fontSize="sm" color="gray.500">Click or drag another to replace</Text>
                  <Button size="xs" colorScheme="blue" variant="outline" mt={2} onClick={(e) => { e.stopPropagation(); setViewerUrl(form.receipt_url); }}>View Document</Button>
                  {scanning && <Text fontSize="sm" color="purple.500" fontWeight="bold" mt={2}>Analyzing with AI...</Text>}
                </>
              ) : (
                <>
                  <Camera size={32} color="#1B2CC1" />
                  <Text fontWeight="700" color="brand.900" fontSize="md">Drag & Drop Receipt (Image/PDF)</Text>
                  <Text fontSize="sm" color="gray.500">or click to browse your files</Text>
                  {scanning && <Text fontSize="sm" color="purple.500" fontWeight="bold" mt={2}>Analyzing with AI...</Text>}
                </>
              )}
            </Flex>`;

code = code.replace(oldDndContent, newDndContent);
fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log('Drag and Drop preview added!');
