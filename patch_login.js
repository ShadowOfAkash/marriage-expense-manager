const fs = require('fs');
let code = fs.readFileSync('client/src/components/Login.jsx', 'utf8');

code = code.replace(
  "const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();",
  "const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();"
);

const resetFunc = `
  async function handleResetPassword() {
    if (!email) {
      return toast({ title: 'Enter your email', description: 'Please enter your email address in the field above to reset your password.', status: 'warning' });
    }
    try {
      await resetPassword(email);
      toast({ title: 'Email Sent', description: 'Check your inbox for password reset instructions.', status: 'success' });
    } catch (err) {
      toast({ title: 'Reset Failed', description: err.message, status: 'error' });
    }
  }
`;

code = code.replace("async function handleEmailSubmit(e) {", resetFunc + "\n  async function handleEmailSubmit(e) {");

const loginMarkup = `
                <Button type="submit" bg="brand.900" color="white" w="100%" size="lg" isLoading={loading} _hover={{ bg: 'brand.800' }}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </VStack>
            </form>

            {isLogin && (
              <Text textAlign="center" fontSize="sm" color="brand.500" cursor="pointer" onClick={handleResetPassword}>
                Forgot Password?
              </Text>
            )}
`;

code = code.replace(
  "                <Button type=\"submit\" bg=\"brand.900\" color=\"white\" w=\"100%\" size=\"lg\" isLoading={loading} _hover={{ bg: 'brand.800' }}>\n                  {isLogin ? 'Sign In' : 'Sign Up'}\n                </Button>\n              </VStack>\n            </form>",
  loginMarkup
);

// We should also gracefully handle the auth/email-already-in-use error
code = code.replace(
  "toast({ title: 'Authentication Failed', description: err.message, status: 'error' });",
  `if (err.code === 'auth/email-already-in-use') {
        toast({ title: 'Email Already Exists', description: 'This email is already registered. If you created it with Google, please click "Continue with Google", or use "Forgot Password" to set a password!', status: 'warning', duration: 8000 });
      } else {
        toast({ title: 'Authentication Failed', description: err.message, status: 'error' });
      }`
);

fs.writeFileSync('client/src/components/Login.jsx', code);
console.log('Login.jsx patched for password reset');
