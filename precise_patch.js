const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

// 1. Add handleDocUpload
const uploadFn = `
  const [isUploading, setIsUploading] = useState(false);
  const handleDocUpload = async (e, isEdit) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsUploading(true);
        const base64 = reader.result.split(',')[1];
        const res = await api.uploadDocument(base64, file.name);
        if (isEdit) {
          setEditItem({ ...editItem, receipt_url: res.url });
        } else {
          setForm({ ...form, receipt_url: res.url });
        }
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
if (!code.includes("handleDocUpload")) {
  code = code.replace("const handleScan = async (e) => {", uploadFn + "\n  const handleScan = async (e) => {");
}

// 2. Main Form Button
const targetMainBtn = `<Button
              variant="ghost" colorScheme="gray" borderRadius="10px"
              onClick={() => setForm({ ...EMPTY_FORM, date: today() })}
              fontSize="sm"
            >
              Clear
            </Button>`;
const replaceMainBtn = `<Button
              variant="ghost" colorScheme="gray" borderRadius="10px"
              onClick={() => setForm({ ...EMPTY_FORM, date: today() })}
              fontSize="sm"
            >
              Clear
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
              ml={2}
            >
              {form.receipt_url ? 'Change Doc' : 'Attach Doc'}
              <input
                id="doc-upload"
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleDocUpload(e, false)}
              />
            </Button>
            {form.receipt_url && (
              <Button size="sm" variant="ghost" colorScheme="purple" p={1} onClick={() => window.open(form.receipt_url, '_blank')} title="View Attached Document">
                <ImageIcon size={14} />
              </Button>
            )}`;

if (!code.includes("htmlFor=\"doc-upload\"")) {
  code = code.replace(targetMainBtn, replaceMainBtn);
}

// 3. Edit Form Button
const targetEditBtn = `<Button variant="ghost" onClick={onEditClose} borderRadius="10px">Cancel</Button>`;
const replaceEditBtn = `<Button
              as="label"
              htmlFor="doc-upload-edit"
              size="sm"
              variant="outline"
              colorScheme="gray"
              borderRadius="10px"
              leftIcon={<Paperclip size={14} />}
              isLoading={isUploading}
              cursor="pointer"
              mr="auto"
            >
              {editItem?.receipt_url ? 'Change Doc' : 'Attach Doc'}
              <input
                id="doc-upload-edit"
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleDocUpload(e, true)}
              />
            </Button>
            {editItem?.receipt_url && (
              <Button size="sm" variant="ghost" colorScheme="purple" mr={2} onClick={() => window.open(editItem.receipt_url, '_blank')}>
                <ImageIcon size={14} /> View
              </Button>
            )}
            <Button variant="ghost" onClick={onEditClose} borderRadius="10px">Cancel</Button>`;

if (!code.includes("htmlFor=\"doc-upload-edit\"")) {
  code = code.replace(targetEditBtn, replaceEditBtn);
}

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Expenses.jsx precisely patched!");
