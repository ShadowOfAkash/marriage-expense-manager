import React, { useState } from 'react';
import { Button, TextField, Label, Input, FieldError } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();
  const toast = useToast();

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
      if (err.code === 'auth/email-already-in-use') {
        toast({ title: 'Email Already Exists', description: 'This email is already registered.', status: 'warning', duration: 8000 });
      } else {
        toast({ title: 'Authentication Failed', description: err.message, status: 'error' });
      }
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              M
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Marriage Payment Manager</h1>
            <p className="text-zinc-500 mt-2">Welcome back! Please sign in to continue.</p>
          </div>

          <Button
            className="w-full h-12 font-bold bg-white border-1 border-zinc-300 text-zinc-700 shadow-sm hover:bg-zinc-50"
            variant="solid"
            onClick={handleGoogleLogin}
          >
            <div className="flex items-center gap-2">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
              Continue with Google
            </div>
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-sm text-zinc-400 whitespace-nowrap">or email</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <TextField isRequired>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </TextField>
            <TextField isRequired>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </TextField>

            <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-12 font-bold mt-2" isLoading={loading}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          {isLogin && (
            <div className="text-center text-sm text-zinc-900 cursor-pointer font-medium hover:underline" onClick={handleResetPassword}>
              Forgot Password?
            </div>
          )}

          <div className="text-center text-sm text-zinc-500 mt-2">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="text-zinc-900 font-bold cursor-pointer hover:underline" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
