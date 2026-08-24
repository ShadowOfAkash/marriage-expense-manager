const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

const oldModalBody = `<ModalBody pb={6}>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
            
            <Button
              size="sm"
              colorScheme="purple"
              variant="outline"
              leftIcon={<Camera size={14} />}
              onClick={() => fileInputRef.current?.click()}
              isLoading={scanning}
              loadingText="Analyzing..."
              borderRadius="10px"
              mb={5}
            >
              Scan Receipt 📸
            </Button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleScan} style={{ display: 'none' }} />
          </Flex>
          
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>`;

const newModalBody = `<ModalBody pb={6}>
          <Box
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleScan({ target: { files: [e.dataTransfer.files[0]] } });
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            border="2px dashed"
            borderColor="brand.300"
            borderRadius="16px"
            p={8}
            textAlign="center"
            bg="brand.50"
            _hover={{ bg: 'brand.100', cursor: 'pointer' }}
            transition="all 0.2s"
            mb={6}
          >
            <Flex direction="column" align="center" gap={3}>
              <Camera size={32} color="#1B2CC1" />
              <Text fontWeight="700" color="brand.900" fontSize="md">Drag & Drop Receipt (Image/PDF)</Text>
              <Text fontSize="sm" color="gray.500">or click to browse your files</Text>
              {scanning && <Text fontSize="sm" color="purple.500" fontWeight="bold" mt={2}>Analyzing with AI...</Text>}
            </Flex>
            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleScan} style={{ display: 'none' }} />
          </Box>
          
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={5}>`;

code = code.replace(oldModalBody, newModalBody);
fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log('Expenses Add Modal patched for UI!');
