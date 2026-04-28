import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn, UserPlus, Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Enter your email above first, then click Forgot Password.');
      setMsg('');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg('Reset link sent! Check your inbox.');
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
      setMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: boolean) => {
    setIsLogin(mode);
    setError('');
    setMsg('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">

        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-primary mb-4">
            <span className="w-4 h-px bg-primary" />
            The Voices
            <span className="w-4 h-px bg-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-heading text-foreground tracking-tight leading-none mb-3">
            {isLogin ? 'Welcome Back.' : 'Join the Press.'}
          </h1>
          <p className="text-sm font-sans text-gray-500">
            {isLogin
              ? 'Sign in to read, write, and engage with The Voices community.'
              : 'Create your account and start publishing your stories today.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border border-card-border bg-card mb-8 p-1 gap-1">
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 ${
              isLogin
                ? 'bg-foreground text-background'
                : 'text-gray-500 hover:text-foreground'
            }`}
          >
            <LogIn className="w-3 h-3" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 ${
              !isLogin
                ? 'bg-foreground text-background'
                : 'text-gray-500 hover:text-foreground'
            }`}
          >
            <UserPlus className="w-3 h-3" />
            Sign Up
          </button>
        </div>

        {/* Card */}
        <div className="bg-card border border-card-border p-8">

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-3 bg-red-950/40 border border-red-900/50 px-4 py-3 mb-6 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="font-sans leading-relaxed">{error}</span>
            </div>
          )}
          {msg && (
            <div className="flex items-start gap-3 bg-green-950/40 border border-green-900/50 px-4 py-3 mb-6 text-sm text-green-400">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="font-sans leading-relaxed">{msg}</span>
            </div>
          )}

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 border border-card-border text-sm font-semibold text-gray-300 hover:text-foreground hover:border-gray-500 transition-all duration-200 mb-6 disabled:opacity-50"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-card-border" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">or with email</span>
            <div className="flex-1 h-px bg-card-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-card-border pl-10 pr-4 py-3 text-sm text-foreground font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-gray-700"
                  placeholder="you@thevoices.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] font-semibold text-gray-600 hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-card-border pl-10 pr-12 py-3 text-sm text-foreground font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-gray-700"
                  placeholder="••••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-foreground transition-colors p-1 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && (
                <p className="mt-1.5 text-[10px] text-gray-600 font-sans">Minimum 6 characters.</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3.5 bg-foreground text-background text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-foreground transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? 'Sign In to The Voices' : 'Create My Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Switch */}
        <p className="mt-6 text-center text-xs font-sans text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(!isLogin)}
            className="font-bold text-foreground hover:text-primary transition-colors underline underline-offset-4"
          >
            {isLogin ? 'Sign up free →' : 'Sign in →'}
          </button>
        </p>

        {/* Trust line */}
        <p className="mt-4 text-center text-[10px] text-gray-700 font-sans">
          By continuing, you agree to The Voices' Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
