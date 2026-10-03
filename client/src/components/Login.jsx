import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Heart, Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('akashtiwari.mnnit@gmail.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();
  const toast = useToast();

  async function handleResetPassword() {
    if (!email) {
      return toast({ title: 'Enter your email', description: 'Please enter your email.', status: 'warning' });
    }
    try {
      await resetPassword(email);
      toast({ title: 'Email Sent', description: 'Check your inbox for instructions.', status: 'success' });
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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4 font-sans text-zinc-900 relative overflow-hidden">
      {/* Subtle SaaS Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-amber-500/5 to-rose-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-zinc-200/20 to-transparent rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-zinc-200 shadow-sm mb-4">
            <Heart size={20} className="fill-zinc-800 text-zinc-800" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-2">Hitchd.</h1>
          <p className="text-zinc-500 text-sm font-medium">Premium Wedding Registry & Planner</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-8 md:p-10 rounded-[1.5rem] border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px] bg-zinc-100" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Or</span>
            <div className="flex-1 h-[1px] bg-zinc-100" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={16} className="text-zinc-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-300 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wide">Password</label>
                {isLogin && (
                  <button type="button" onClick={handleResetPassword} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-zinc-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-300 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3.5 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-zinc-800 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="font-bold underline underline-offset-2">
              {isLogin ? 'Sign up' : 'Sign in'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
