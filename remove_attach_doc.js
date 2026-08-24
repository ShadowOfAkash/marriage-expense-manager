const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

const oldButtons = `<Button
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
              <Button size="sm" variant="ghost" colorScheme="purple" p={1} onClick={() => setViewerUrl(form.receipt_url)} title="View Attached Document">
                <ImageIcon size={14} />
              </Button>
            )}`;

code = code.replace(oldButtons, '');
fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log('Removed old Attach Doc buttons from Add Expense footer!');
