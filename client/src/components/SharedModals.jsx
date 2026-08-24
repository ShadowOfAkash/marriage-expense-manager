import React, { useState, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  SimpleGrid, FormControl, FormLabel, Input, Select, Button, HStack, Flex, Box, Text, InputGroup, InputLeftAddon, useToast
} from '@chakra-ui/react';
import { Plus, Tag, IndianRupee, Calendar, AlignLeft, Camera, Image as ImageIcon, CalendarDays, StickyNote } from 'lucide-react';
import { api, CATEGORIES, MONTH_NAMES } from '../utils/api';

const EMPTY_EXP_FORM = { category: '', description: '', amount: '', date: '', receipt_url: '' };

export function AddExpenseModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_EXP_FORM, date: new Date().toISOString().split('T')[0] });
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        try {
          const aiData = await api.scanReceipt(base64String, file.type);
          setForm(prev => ({
            ...prev,
            category: aiData.category || '',
            description: aiData.description || '',
            amount: aiData.amount ? String(aiData.amount) : '',
            date: aiData.date || new Date().toISOString().split('T')[0],
            receipt_url: aiData.receipt_url || ''
          }));
          toast({ title: 'Receipt Scanned!', status: 'success', duration: 3000 });
        } catch (err) {
          toast({ title: 'Scan Failed', description: err.message, status: 'error', duration: 3000 });
        } finally {
          setScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setScanning(false);
    }
  };

  const handleAdd = async () => {
    if (!form.category || !form.amount || !form.date) return toast({ title: 'Fill required fields', status: 'warning' });
    setSaving(true);
    try {
      await api.addExpense({ ...form, amount: Number(form.amount) });
      toast({ title: 'Expense saved!', status: 'success' });
      setForm({ ...EMPTY_EXP_FORM, date: new Date().toISOString().split('T')[0] });
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      toast({ title: 'Error saving', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay backdropFilter="blur(6px)" />
      <ModalContent borderRadius="20px" shadow="xl">
        <ModalHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
          <HStack spacing={2}><Plus size={16} color="#1B2CC1" /><Text>Add New Expense</Text></HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleScan({ target: { files: [e.dataTransfer.files[0]] } });
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            border="2px dashed" borderColor="brand.300" borderRadius="16px" p={8} textAlign="center" bg="brand.50"
            _hover={{ bg: 'brand.100', cursor: 'pointer' }} transition="all 0.2s" mb={6}
          >
            <Flex direction="column" align="center" gap={3}>
              {form.receipt_url ? (
                <>
                  <ImageIcon size={32} color="#10B981" />
                  <Text fontWeight="700" color="green.600">Document Uploaded Successfully!</Text>
                  <Text fontSize="sm" color="gray.500">Click or drag another to replace</Text>
                  <Button size="xs" colorScheme="blue" variant="outline" mt={2} onClick={(e) => { e.stopPropagation(); window.open(form.receipt_url, '_blank'); }}>View Document</Button>
                  {scanning && <Text fontSize="sm" color="purple.500" fontWeight="bold">Analyzing...</Text>}
                </>
              ) : (
                <>
                  <Camera size={32} color="#1B2CC1" />
                  <Text fontWeight="700" color="brand.900">Drag & Drop Receipt (Image/PDF)</Text>
                  <Text fontSize="sm" color="gray.500">or click to browse your files</Text>
                  {scanning && <Text fontSize="sm" color="purple.500" fontWeight="bold">Analyzing with AI...</Text>}
                </>
              )}
            </Flex>
            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleScan} style={{ display: 'none' }} />
          </Box>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={5}>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase"><HStack spacing={1.5}><Tag size={12} /><Text>Category</Text></HStack></FormLabel>
              <Select value={form.category} onChange={e => setF('category', e.target.value)} placeholder="— Select —" bg="gray.50" borderRadius="10px">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase"><HStack spacing={1.5}><IndianRupee size={12} /><Text>Amount</Text></HStack></FormLabel>
              <InputGroup>
                <InputLeftAddon bg="brand.50" color="brand.700" borderRadius="10px 0 0 10px">₹</InputLeftAddon>
                <Input type="number" value={form.amount} onChange={e => setF('amount', e.target.value)} bg="gray.50" borderRadius="0 10px 10px 0" />
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase"><HStack spacing={1.5}><Calendar size={12} /><Text>Date</Text></HStack></FormLabel>
              <Input type="date" value={form.date} onChange={e => setF('date', e.target.value)} bg="gray.50" borderRadius="10px" />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase"><HStack spacing={1.5}><AlignLeft size={12} /><Text>Description</Text></HStack></FormLabel>
              <Input value={form.description} onChange={e => setF('description', e.target.value)} bg="gray.50" borderRadius="10px" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </FormControl>
          </SimpleGrid>
          <HStack mt={5}>
            <Button bgGradient="linear(135deg, brand.600, plum.600)" color="white" _hover={{ bgGradient: 'linear(135deg, brand.700, plum.700)', transform: 'translateY(-1px)' }} leftIcon={<Plus size={15} />} onClick={handleAdd} isLoading={saving} borderRadius="10px">Save Expense</Button>
            <Button variant="ghost" onClick={() => setForm({ ...EMPTY_EXP_FORM, date: new Date().toISOString().split('T')[0] })} borderRadius="10px">Clear</Button>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function AddSavingModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const currentMonth = () => new Date().toLocaleString('default', { month: 'long' });
  const currentYear = () => new Date().getFullYear();
  
  const [form, setForm] = useState({ month: currentMonth(), year: currentYear(), amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast({ title: 'Enter amount', status: 'warning' });
    setSaving(true);
    try {
      await api.addSavings(form);
      toast({ title: 'Savings logged!', status: 'success' });
      setForm({ month: currentMonth(), year: currentYear(), amount: '', note: '' });
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      toast({ title: 'Error saving', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay backdropFilter="blur(6px)" />
      <ModalContent borderRadius="20px" shadow="xl">
        <ModalHeader color="gray.800" fontWeight="800" fontSize="md" pt={5}>
          <HStack spacing={2}><Plus size={16} color="#1B2CC1" /><Text>Log Saving</Text></HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={5}>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase"><HStack spacing={1.5}><CalendarDays size={12} /><Text>Month</Text></HStack></FormLabel>
              <Select value={form.month} onChange={e => setF('month', e.target.value)} bg="gray.50" borderRadius="10px">
                {MONTH_NAMES.map(m => <option key={m}>{m}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase"><HStack spacing={1.5}><CalendarDays size={12} /><Text>Year</Text></HStack></FormLabel>
              <Input type="number" value={form.year} onChange={e => setF('year', e.target.value)} bg="gray.50" borderRadius="10px" />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase"><HStack spacing={1.5}><IndianRupee size={12} /><Text>Amount</Text></HStack></FormLabel>
              <InputGroup>
                <InputLeftAddon bg="brand.50" borderRadius="10px 0 0 10px">₹</InputLeftAddon>
                <Input type="number" value={form.amount} onChange={e => setF('amount', e.target.value)} bg="gray.50" borderRadius="0 10px 10px 0" />
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase"><HStack spacing={1.5}><StickyNote size={12} /><Text>Notes</Text></HStack></FormLabel>
              <Input value={form.note} onChange={e => setF('note', e.target.value)} bg="gray.50" borderRadius="10px" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </FormControl>
          </SimpleGrid>
          <HStack mt={5}>
            <Button bgGradient="linear(135deg, green.500, teal.500)" color="white" leftIcon={<Plus size={15} />} onClick={handleAdd} isLoading={saving} borderRadius="10px">Save Entry</Button>
            <Button variant="ghost" onClick={() => setForm({ month: currentMonth(), year: currentYear(), amount: '', note: '' })} borderRadius="10px">Clear</Button>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
