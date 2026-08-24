import React from 'react'
import {
  Box, Flex, Text, Button, HStack, Container,
  Avatar, Menu, MenuButton, MenuList, MenuItem,
  MenuDivider, useToast, VStack,
} from '@chakra-ui/react'
import {
  LayoutDashboard, Receipt, PiggyBank,
  ChevronDown, LogOut, User, Gem,
} from 'lucide-react'
import { api } from '../utils/api'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'expenses',  label: 'Expenses',  Icon: Receipt          },
  { id: 'savings',   label: 'Savings',   Icon: PiggyBank        },
]

export default function Navbar({ user, activeTab, setActiveTab, onLogout }) {
  const toast = useToast()

  const handleLogout = async () => {
    try { await api.logout() } catch (_) {}
    toast({ title: 'Logged out successfully', status: 'info', duration: 2000, isClosable: true })
    onLogout()
  }

  return (
    <Box
      bg="linear-gradient(135deg, #1C1125 0%, #2D1242 45%, #3D1654 100%)"
      borderBottom="1px solid rgba(190,24,93,0.25)"
      position="sticky"
      top={0}
      zIndex={100}
      boxShadow="0 4px 24px rgba(0,0,0,0.35)"
    >
      <Container maxW="7xl">
        <Flex h="68px" align="center" justify="space-between" gap={4}>

          {/* ── Brand Logo ──────────────────────────────── */}
          <HStack spacing={3} flexShrink={0}>
            <Flex
              w={10} h={10}
              borderRadius="12px"
              bgGradient="linear(135deg, brand.600, plum.600)"
              align="center" justify="center"
              boxShadow="0 2px 10px rgba(190,24,93,0.45)"
            >
              <Gem size={18} color="white" />
            </Flex>
            <Box display={{ base: 'none', sm: 'block' }}>
              <Text
                color="white"
                fontWeight="800"
                fontSize="md"
                letterSpacing="-0.3px"
                lineHeight="tight"
              >
                Shaadi Tracker
              </Text>
              <Text
                color="whiteAlpha.500"
                fontSize="9px"
                letterSpacing="widest"
                textTransform="uppercase"
                lineHeight="tight"
              >
                Wedding Budget Manager
              </Text>
            </Box>
          </HStack>

          {/* ── Pill Tab Nav (Desktop) ───────────────────── */}
          <Flex
            display={{ base: 'none', md: 'flex' }}
            bg="whiteAlpha.100"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="14px"
            p="5px"
            gap="4px"
            align="center"
          >
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id
              return (
                <Button
                  key={id}
                  size="sm"
                  leftIcon={<Icon size={15} />}
                  bg={isActive ? 'white' : 'transparent'}
                  color={isActive ? 'brand.700' : 'whiteAlpha.700'}
                  boxShadow={isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'}
                  borderRadius="10px"
                  px={4}
                  h="34px"
                  fontWeight={isActive ? '700' : '500'}
                  fontSize="sm"
                  _hover={{
                    bg: isActive ? 'white' : 'whiteAlpha.150',
                    color: isActive ? 'brand.700' : 'white',
                  }}
                  _active={{ transform: 'scale(0.97)' }}
                  transition="all 0.18s ease"
                  onClick={() => setActiveTab(id)}
                  gap={2}
                >
                  {label}
                </Button>
              )
            })}
          </Flex>

          {/* ── User Menu ───────────────────────────────── */}
          <Menu>
            <MenuButton
              as={Button}
              variant="unstyled"
              display="flex"
              alignItems="center"
              cursor="pointer"
              flexShrink={0}
              _hover={{ opacity: 0.85 }}
              _active={{ opacity: 0.7 }}
            >
              <HStack
                spacing={2}
                bg="whiteAlpha.100"
                border="1px solid rgba(255,255,255,0.12)"
                borderRadius="40px"
                px={3}
                py={1.5}
              >
                <Avatar
                  size="xs"
                  name={user.name}
                  bg="linear-gradient(135deg, #BE185D, #643994)"
                  color="white"
                  fontWeight="bold"
                  fontSize="xs"
                />
                <Text
                  color="white"
                  fontSize="sm"
                  fontWeight="600"
                  display={{ base: 'none', sm: 'block' }}
                  maxW="120px"
                  noOfLines={1}
                >
                  {user.name.split(' ')[0]}
                </Text>
                <ChevronDown size={13} color="rgba(255,255,255,0.5)" />
              </HStack>
            </MenuButton>

            <MenuList
              bg="white"
              border="1px solid"
              borderColor="gray.100"
              shadow="0 8px 40px rgba(0,0,0,0.15)"
              borderRadius="14px"
              py={2}
              minW="220px"
              overflow="hidden"
            >
              {/* User info header */}
              <Box px={4} py={3} bg="gray.50" borderBottom="1px solid" borderColor="gray.100">
                <HStack spacing={2}>
                  <Avatar size="sm" name={user.name} bg="brand.600" color="white" />
                  <Box>
                    <Text fontWeight="700" fontSize="sm" color="gray.800">{user.name}</Text>
                    <Text fontSize="11px" color="gray.500">{user.email}</Text>
                  </Box>
                </HStack>
              </Box>

              <MenuItem
                icon={<User size={14} />}
                fontSize="sm"
                color="gray.700"
                _hover={{ bg: 'brand.50', color: 'brand.700' }}
                px={4}
                py={2.5}
              >
                Profile
              </MenuItem>
              <MenuDivider my={1} />
              <MenuItem
                icon={<LogOut size={14} />}
                fontSize="sm"
                color="red.500"
                _hover={{ bg: 'red.50' }}
                onClick={handleLogout}
                px={4}
                py={2.5}
              >
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>

        {/* ── Mobile Bottom Tabs ──────────────────────────── */}
        <Flex
          display={{ base: 'flex', md: 'none' }}
          pb={2}
          gap={1}
          bg="whiteAlpha.100"
          borderRadius="12px"
          p={1}
          mb={1}
        >
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <Button
                key={id}
                flex={1}
                size="xs"
                leftIcon={<Icon size={13} />}
                bg={isActive ? 'white' : 'transparent'}
                color={isActive ? 'brand.700' : 'whiteAlpha.700'}
                borderRadius="9px"
                fontWeight={isActive ? '700' : '500'}
                _hover={{ bg: isActive ? 'white' : 'whiteAlpha.200', color: isActive ? 'brand.700' : 'white' }}
                onClick={() => setActiveTab(id)}
                transition="all 0.15s"
                h="32px"
              >
                {label}
              </Button>
            )
          })}
        </Flex>
      </Container>
    </Box>
  )
}
