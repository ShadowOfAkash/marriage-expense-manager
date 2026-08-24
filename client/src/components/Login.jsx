import React, { useState } from 'react'
import {
  Box, VStack, Heading, Text, FormControl, FormLabel,
  Input, Button, InputGroup, InputRightElement, IconButton,
  useToast, Card, CardBody, FormErrorMessage, Flex, Badge, HStack,
} from '@chakra-ui/react'
import { Eye, EyeOff, Gem, Sparkles, Shield, TrendingUp } from 'lucide-react'
import { api } from '../utils/api'

const FEATURES = [
  { Icon: TrendingUp, label: 'Savings Tracker'   },
  { Icon: Shield,     label: 'Secure & Private'  },
  { Icon: Sparkles,   label: 'Smart Dashboard'   },
]

export default function Login({ onLogin }) {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [errors,       setErrors]       = useState({})
  const toast = useToast()

  const validate = () => {
    const e = {}
    if (!email)    e.email    = 'Email is required'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = await api.login(email, password)
      toast({ title: `Welcome, ${data.name}!`, description: 'Ready to plan your perfect wedding 💍', status: 'success', duration: 3000, isClosable: true })
      onLogin({ name: data.name, email: data.email }, data.token)
    } catch (err) {
      toast({ title: 'Login Failed', description: err.message, status: 'error', duration: 4000, isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex
      minH="100vh"
      bg="linear-gradient(135deg, #1C1125 0%, #2D1242 40%, #3D1654 70%, #4A1760 100%)"
      align="center"
      justify="center"
      p={4}
      overflow="hidden"
      position="relative"
    >
      {/* Decorative glowing orbs */}
      <Box position="absolute" top="-100px" right="-60px" w="400px" h="400px"
        bg="brand.600" borderRadius="full" filter="blur(100px)" opacity={0.12} pointerEvents="none" />
      <Box position="absolute" bottom="-80px" left="-60px" w="350px" h="350px"
        bg="plum.500" borderRadius="full" filter="blur(90px)" opacity={0.1} pointerEvents="none" />
      <Box position="absolute" top="40%" left="20%" w="200px" h="200px"
        bg="gold.400" borderRadius="full" filter="blur(80px)" opacity={0.06} pointerEvents="none" />

      <Flex
        direction={{ base: 'column', lg: 'row' }}
        w="100%" maxW="900px"
        gap={8}
        align="center"
        position="relative"
        zIndex={1}
      >
        {/* Left — Branding Panel */}
        <VStack flex={1} spacing={6} align={{ base: 'center', lg: 'flex-start' }} textAlign={{ base: 'center', lg: 'left' }}>
          {/* Logo */}
          <HStack spacing={3}>
            <Flex
              w={12} h={12} borderRadius="14px"
              bgGradient="linear(135deg, brand.600, plum.600)"
              align="center" justify="center"
              boxShadow="0 4px 20px rgba(190,24,93,0.4)"
            >
              <Gem size={22} color="white" />
            </Flex>
            <Box>
              <Text color="white" fontWeight="800" fontSize="xl" letterSpacing="-0.4px">Shaadi Tracker</Text>
              <Text color="whiteAlpha.500" fontSize="10px" letterSpacing="widest" textTransform="uppercase">
                Wedding Budget Manager
              </Text>
            </Box>
          </HStack>

          <Box>
            <Heading color="white" size="xl" fontWeight="800" letterSpacing="-0.5px" lineHeight="shorter">
              Plan Your Dream
            </Heading>
            <Heading
              size="xl" fontWeight="800" letterSpacing="-0.5px"
              bgGradient="linear(to-r, brand.300, gold.300)"
              bgClip="text"
            >
              Wedding. ✨
            </Heading>
          </Box>

          <Text color="whiteAlpha.600" fontSize="sm" maxW="300px" lineHeight="tall">
            Track every expense, save with purpose, and make your special day perfect — without the financial stress.
          </Text>

          <VStack spacing={3} align={{ base: 'center', lg: 'flex-start' }}>
            {FEATURES.map(({ Icon, label }) => (
              <HStack key={label} spacing={3}>
                <Flex
                  w={7} h={7} borderRadius="8px"
                  bg="whiteAlpha.100"
                  border="1px solid rgba(255,255,255,0.1)"
                  align="center" justify="center"
                  flexShrink={0}
                >
                  <Icon size={13} color="rgba(255,255,255,0.7)" />
                </Flex>
                <Text color="whiteAlpha.700" fontSize="sm">{label}</Text>
              </HStack>
            ))}
          </VStack>
        </VStack>

        {/* Right — Login Card */}
        <Box w="100%" maxW="400px">
          <Card
            bg="white"
            shadow="0 24px 64px rgba(0,0,0,0.4)"
            borderRadius="24px"
            overflow="hidden"
            border="1px solid rgba(255,255,255,0.1)"
          >
            {/* Top gradient bar */}
            <Box h="4px" bgGradient="linear(to-r, brand.500, plum.500, gold.500)" />

            <CardBody p={8}>
              <VStack spacing={1} mb={7} align="flex-start">
                <Heading size="md" color="gray.800" fontWeight="800">Welcome back</Heading>
                <Text color="gray.500" fontSize="sm">Sign in to your account</Text>
              </VStack>

              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  {/* Email */}
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Email
                    </FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                      placeholder="your@email.com"
                      focusBorderColor="brand.500"
                      borderColor="gray.200"
                      bg="gray.50"
                      _hover={{ borderColor: 'brand.300', bg: 'white' }}
                      _focus={{ bg: 'white' }}
                      borderRadius="12px"
                      h="46px"
                      fontSize="sm"
                    />
                    <FormErrorMessage fontSize="xs">{errors.email}</FormErrorMessage>
                  </FormControl>

                  {/* Password */}
                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                        placeholder="Enter your password"
                        focusBorderColor="brand.500"
                        borderColor="gray.200"
                        bg="gray.50"
                        _hover={{ borderColor: 'brand.300', bg: 'white' }}
                        _focus={{ bg: 'white' }}
                        borderRadius="12px"
                        h="46px"
                        fontSize="sm"
                        pr={12}
                      />
                      <InputRightElement h="46px" pr={2}>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={showPassword
                            ? <EyeOff size={16} />
                            : <Eye size={16} />}
                          onClick={() => setShowPassword(p => !p)}
                          color="gray.400"
                          _hover={{ color: 'brand.600', bg: 'brand.50' }}
                          aria-label="Toggle password"
                          borderRadius="8px"
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage fontSize="xs">{errors.password}</FormErrorMessage>
                  </FormControl>

                  {/* Submit */}
                  <Button
                    type="submit"
                    w="100%"
                    h="46px"
                    bgGradient="linear(135deg, brand.600, plum.600)"
                    color="white"
                    fontWeight="700"
                    fontSize="sm"
                    borderRadius="12px"
                    _hover={{
                      bgGradient: 'linear(135deg, brand.700, plum.700)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 8px 20px rgba(190,24,93,0.35)',
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    isLoading={loading}
                    loadingText="Signing in…"
                    mt={2}
                    transition="all 0.2s"
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>

          <Text textAlign="center" color="whiteAlpha.400" fontSize="11px" mt={5}>
            Secure · Private · Built for your big day
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}
