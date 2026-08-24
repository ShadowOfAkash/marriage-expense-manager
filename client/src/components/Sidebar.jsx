import React, { useState } from 'react';
import { Box, Flex, VStack, Icon, Text, Button, Divider, Tooltip } from '@chakra-ui/react';
import { LayoutDashboard, Receipt, PiggyBank, LogOut, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { logout, currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses',  label: 'Expenses',  icon: Receipt },
    { id: 'savings',   label: 'Savings',   icon: PiggyBank },
  ];

  return (
    <Box
      w={isExpanded ? '240px' : '72px'}
      bg="brand.900"
      color="white"
      h="100vh"
      position="sticky"
      top={0}
      transition="width 0.2s"
      display="flex"
      flexDirection="column"
      shadow="xl"
      zIndex={100}
    >
      <Flex align="center" justify={isExpanded ? "space-between" : "center"} p={4} h="72px">
        {isExpanded && (
          <Text fontWeight="800" fontSize="lg" letterSpacing="tight">
            Finance<Text as="span" color="brand.200">OS</Text>
          </Text>
        )}
        <Button
          size="sm"
          variant="ghost"
          color="white"
          _hover={{ bg: 'whiteAlpha.200' }}
          onClick={() => setIsExpanded(!isExpanded)}
          px={0}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>
      </Flex>

      <Divider borderColor="whiteAlpha.300" mb={4} />

      <VStack spacing={2} align="stretch" px={3} flex={1}>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <Tooltip label={!isExpanded ? item.label : ''} placement="right" key={item.id}>
              <Flex
                align="center"
                p={3}
                mx={isExpanded ? 0 : 'auto'}
                borderRadius="8px"
                cursor="pointer"
                bg={isActive ? 'brand.600' : 'transparent'}
                color={isActive ? 'white' : 'whiteAlpha.700'}
                _hover={{ bg: isActive ? 'brand.600' : 'whiteAlpha.200', color: 'white' }}
                onClick={() => setActiveTab(item.id)}
                transition="all 0.2s"
                justify={isExpanded ? "flex-start" : "center"}
              >
                <Icon as={item.icon} boxSize={5} />
                {isExpanded && <Text ml={3} fontSize="sm" fontWeight="600">{item.label}</Text>}
              </Flex>
            </Tooltip>
          );
        })}
      </VStack>

      <Divider borderColor="whiteAlpha.300" mt={4} />
      
      {isExpanded && currentUser && (
        <Flex px={4} py={2} align="center" mt={2}>
          <Icon as={User} boxSize={4} color="brand.200" mr={2} />
          <Text fontSize="xs" color="brand.200" isTruncated>{currentUser.email}</Text>
        </Flex>
      )}

      <Box p={3}>
        <Tooltip label={!isExpanded ? "Logout" : ''} placement="right">
          <Flex
            align="center"
            p={3}
            mx={isExpanded ? 0 : 'auto'}
            borderRadius="8px"
            cursor="pointer"
            color="red.300"
            _hover={{ bg: 'whiteAlpha.100', color: 'red.400' }}
            onClick={logout}
            justify={isExpanded ? "flex-start" : "center"}
          >
            <Icon as={LogOut} boxSize={5} />
            {isExpanded && <Text ml={3} fontSize="sm" fontWeight="600">Logout</Text>}
          </Flex>
        </Tooltip>
      </Box>
    </Box>
  );
}
