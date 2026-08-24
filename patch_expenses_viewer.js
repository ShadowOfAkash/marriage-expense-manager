const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

// 1. Add state for viewerUrl
code = code.replace(
  "const [delId,   setDelId]   = useState(null)",
  "const [delId,   setDelId]   = useState(null)\n  const [viewerUrl, setViewerUrl] = useState(null)"
);

// 2. Replace window.open with setViewerUrl
code = code.replace(/window\.open\(([^,]+), '_blank'\)/g, "setViewerUrl($1)");

// 3. Add the Viewer Modal at the bottom, just above </Container>
const viewerModal = `
      {/* ── Document Viewer Modal ── */}
      <Modal isOpen={!!viewerUrl} onClose={() => setViewerUrl(null)} isCentered size="4xl">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent borderRadius="20px" overflow="hidden" shadow="0 24px 64px rgba(0,0,0,0.25)" bg="gray.50">
          <ModalHeader color="gray.800" fontWeight="800" fontSize="md" pt={4} pb={3} bg="white" borderBottom="1px solid" borderColor="gray.100">
            Document Viewer
          </ModalHeader>
          <ModalCloseButton mt={1} />
          <ModalBody p={0} display="flex" justifyContent="center" alignItems="center" minH="50vh">
            {viewerUrl && (
              viewerUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={viewerUrl} width="100%" height="70vh" style={{ border: 'none', minHeight: '600px' }} title="Document Viewer" />
              ) : (
                <img src={viewerUrl} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
              )
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

    </Container>`;

code = code.replace("    </Container>", viewerModal);

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Patched Expenses.jsx to include Document Viewer modal!");
