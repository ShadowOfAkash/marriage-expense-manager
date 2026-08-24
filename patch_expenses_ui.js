const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

// 1. Header
code = code.replace(
  "['#','Date','Category','Description','Amount','Actions']",
  "['#','Date','Category','Description','Amount','Receipt','Actions']"
);

// 2. Td relocation
const targetDescTd = `<Td fontSize="sm" color="gray.700" maxW="220px" borderColor={isDraft ? 'orange.100' : 'gray.50'}>
                        <HStack>
                          {isDraft && <Badge colorScheme="orange" fontSize="9px" borderRadius="4px">DRAFT</Badge>}
                          <Text noOfLines={1}>{e.description || <Text as="span" color="gray.300">—</Text>}</Text>
                          {e.receipt_url && (
                            <Button size="xs" variant="ghost" colorScheme="purple" p={1} h="auto" onClick={() => window.open(e.receipt_url, '_blank')} title="View Receipt">
                              <ImageIcon size={14} />
                            </Button>
                          )}
                        </HStack>
                      </Td>`;
const newDescTd = `<Td fontSize="sm" color="gray.700" maxW="220px" borderColor={isDraft ? 'orange.100' : 'gray.50'}>
                        <HStack>
                          {isDraft && <Badge colorScheme="orange" fontSize="9px" borderRadius="4px">DRAFT</Badge>}
                          <Text noOfLines={1}>{e.description || <Text as="span" color="gray.300">—</Text>}</Text>
                        </HStack>
                      </Td>
                      <Td borderColor={isDraft ? 'orange.100' : 'gray.50'} textAlign="center">
                        {e.receipt_url ? (
                          <Button size="xs" variant="ghost" colorScheme="purple" p={1} h="auto" onClick={() => window.open(e.receipt_url, '_blank')} title="View Document">
                            <ImageIcon size={14} />
                          </Button>
                        ) : <Text color="gray.300" fontSize="10px">—</Text>}
                      </Td>`;
code = code.replace(targetDescTd, newDescTd);

// 3. Add handleDocUpload function inside the component
const uploadFn = `
  const [isUploading, setIsUploading] = useState(false);
  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsUploading(true);
        const base64 = reader.result.split(',')[1];
        const res = await api.uploadDocument(base64, file.name);
        setForm({ ...form, receipt_url: res.url });
        toast({ title: 'Document attached', status: 'success', duration: 2000 });
      } catch (err) {
        toast({ title: 'Upload failed', description: err.message, status: 'error', duration: 3000 });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };
`;
// Inject right before handleScan
code = code.replace("const handleScan = () => {", uploadFn + "\n  const handleScan = () => {");

// 4. Import Paperclip
code = code.replace("Image as ImageIcon", "Image as ImageIcon, Paperclip");

// 5. Add Document Upload button to the Form actions
// The form actions are at the bottom of the form
const formActionsOld = `Scan Receipt 📸
              </Button>
              {form.receipt_url && (
                <Button size="sm" variant="outline" colorScheme="purple" borderRadius="10px" onClick={() => window.open(form.receipt_url, '_blank')} leftIcon={<ImageIcon size={14} />}>
                  View Attached Receipt
                </Button>
              )}
              <Button
                display="none"`;
const formActionsNew = `Scan Receipt 📸
              </Button>
              
              <Button
                as="label"
                htmlFor="doc-upload"
                size="sm"
                variant="outline"
                colorScheme="gray"
                borderRadius="10px"
                leftIcon={<Paperclip size={14} />}
                isLoading={isUploading}
                cursor="pointer"
              >
                Attach Document
                <input
                  id="doc-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleDocUpload}
                />
              </Button>

              {form.receipt_url && (
                <Button size="sm" variant="solid" colorScheme="purple" borderRadius="10px" onClick={() => window.open(form.receipt_url, '_blank')} leftIcon={<ImageIcon size={14} />}>
                  View Document
                </Button>
              )}
              <Button
                display="none"`;
code = code.replace(formActionsOld, formActionsNew);

// Do the same for the Edit Modal buttons which are at the bottom of the modal.
// Wait, the Edit Modal doesn't have the Scan Receipt button. It just has standard inputs.
// I will just add the attach document button to the Edit modal as well.
const modalFooterOld = `<Button colorScheme="brand" onClick={handleEditSave} borderRadius="10px" shadow="0 4px 12px rgba(190,24,93,0.2)">Save Changes</Button>`;
const modalFooterNew = `<Button
                as="label"
                htmlFor="doc-upload-edit"
                size="sm"
                variant="outline"
                colorScheme="gray"
                borderRadius="10px"
                leftIcon={<Paperclip size={14} />}
                isLoading={isUploading}
                cursor="pointer"
                mr={auto}
              >
                {editForm?.receipt_url ? 'Change Document' : 'Attach Document'}
                <input
                  id="doc-upload-edit"
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        setIsUploading(true);
                        const base64 = reader.result.split(',')[1];
                        const res = await api.uploadDocument(base64, file.name);
                        setEditForm({ ...editForm, receipt_url: res.url });
                        toast({ title: 'Document attached', status: 'success', duration: 2000 });
                      } catch (err) {
                        toast({ title: 'Upload failed', description: err.message, status: 'error', duration: 3000 });
                      } finally {
                        setIsUploading(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </Button>
              {editForm?.receipt_url && (
                <Button size="sm" variant="ghost" colorScheme="purple" mr={2} onClick={() => window.open(editForm.receipt_url, '_blank')}>
                  View
                </Button>
              )}
              <Button colorScheme="brand" onClick={handleEditSave} borderRadius="10px" shadow="0 4px 12px rgba(190,24,93,0.2)">Save Changes</Button>`;
// We'll replace this carefully using auto margin right
code = code.replace(modalFooterOld, modalFooterNew.replace('mr={auto}', 'mr="auto"'));

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Expenses UI updated successfully.");
