import React, { useState } from 'react';
import {
  Box, Container, VStack, Heading, Text, Input, Button, Divider,
  HStack, useToast, Flex, Image
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const toast = useToast();

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
    } catch (err) {
      toast({ title: 'Authentication Failed', description: err.message, status: 'error' });
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    try {
      await loginWithGoogle();
    } catch (err) {
      toast({ title: 'Google Login Failed', description: err.message, status: 'error' });
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="2xl" shadow="xl">
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Flex w={12} h={12} bg="brand.900" color="white" borderRadius="xl" align="center" justify="center" mx="auto" mb={4} fontSize="xl" fontWeight="bold">
                M
              </Flex>
              <Heading size="lg" color="brand.900">Marriage Expense Manager</Heading>
              <Text color="gray.500" mt={2}>Welcome back! Please sign in to continue.</Text>
            </Box>

            <Button
              w="100%"
              variant="outline"
              size="lg"
              onClick={handleGoogleLogin}
              leftIcon={<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20px" />}
            >
              Continue with Google
            </Button>

            <HStack>
              <Divider />
              <Text fontSize="sm" whiteSpace="nowrap" color="gray.400">or email</Text>
              <Divider />
            </HStack>

            <form onSubmit={handleEmailSubmit}>
              <VStack spacing={4}>
                <Input
                  placeholder="Email Address"
                  type="email"
                  size="lg"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Input
                  placeholder="Password"
                  type="password"
                  size="lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" bg="brand.900" color="white" w="100%" size="lg" isLoading={loading} _hover={{ bg: 'brand.800' }}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </VStack>
            </form>

            <Text textAlign="center" fontSize="sm" color="gray.500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text as="span" color="brand.500" fontWeight="bold" cursor="pointer" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
