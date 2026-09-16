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
      if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        toast({ 
          title: 'Domain Not Authorized in Firebase', 
          description: `Add "${domain}" in Firebase Console → Authentication → Settings → Authorized domains.`, 
          status: 'error',
          duration: 10000 
        });
      } else {
        toast({ title: 'Google Login Failed', description: err.message, status: 'error' });
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF8F5] via-[#FFFDFB] to-[#F5EFE6] p-4 relative overflow-hidden">
      {/* Decorative background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-200/30 to-amber-200/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="bg-white/95 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-xl border border-rose-100/80 flex flex-col gap-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#D97757] to-[#C86D51] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-md shadow-rose-900/10">
              💍
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-[#D97757] text-[11px] font-bold uppercase tracking-wider mb-2">
              Wedding Suite
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Marriage Manager</h1>
            <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">
              Your dream wedding, effortlessly planned, coordinated, and celebrated.
            </p>
          </div>

          <Button
            radius="sm"
            className="w-full h-12 font-bold bg-white border border-zinc-200 text-zinc-700 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer"
            variant="solid"
            onClick={handleGoogleLogin}
          >
            <div className="flex items-center justify-center gap-2.5">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
              <span>Continue with Google</span>
            </div>
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200/80" />
            <span className="text-xs text-zinc-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-zinc-200/80" />
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3.5">
            <TextField isRequired>
              <Label className="text-xs font-bold text-zinc-600 mb-1">Email Address</Label>
              <Input
                radius="sm"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </TextField>

            <TextField isRequired>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-xs font-bold text-zinc-600">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs text-[#D97757] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <Input
                radius="sm"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </TextField>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-12 rounded-xl bg-gradient-to-r from-[#D97757] to-[#C86D51] hover:from-[#C86D51] hover:to-[#B55F45] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In to Your Wedding' : 'Create Your Account'}
            </button>
          </form>

          <div className="text-center pt-1 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-zinc-600 hover:text-zinc-900 font-medium cursor-pointer"
            >
              {isLogin ? "First time planning? " : "Already have an account? "}
              <span className="text-[#D97757] font-bold underline">
                {isLogin ? 'Create an account' : 'Sign in'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
