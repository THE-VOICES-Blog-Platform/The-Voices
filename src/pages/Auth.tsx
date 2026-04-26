import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An error occurred during authentication.');
      } else {
        setError('An error occurred during authentication.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An error occurred during Google sign in.');
      } else {
        setError('An error occurred during Google sign in.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] py-12">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="text-center mb-8 border-b-4 border-black pb-6">
          <h2 className="text-4xl font-black font-heading uppercase tracking-tighter">
            {isLogin ? 'Subscribe' : 'Join the Press'}
          </h2>
          <p className="font-serif italic text-sm mt-2">
            {isLogin ? "Welcome back, reader." : "Become a contributing writer today."}
          </p>
        </div>
        
        {error && (
          <div className="border-2 border-black bg-gray-100 px-4 py-3 mb-6 text-sm font-bold uppercase text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-black mb-2 border-b border-black w-max pb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-2 border-black px-4 py-3 text-black font-mono focus:outline-none focus:bg-black focus:text-white transition-colors"
              placeholder="reader@gazette.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-black mb-2 border-b border-black w-max pb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-2 border-black px-4 py-3 pr-12 text-black font-mono focus:outline-none focus:bg-black focus:text-white transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-gray-600 focus:outline-none p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 mt-4">
            <button 
              type="submit" 
              className="btn-premium w-full py-4 flex gap-2"
            >
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-1 bg-black"></div>
              <span className="font-black text-xs uppercase tracking-widest">OR</span>
              <div className="flex-1 h-1 bg-black"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="btn-outline w-full py-4 flex gap-2 bg-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </form>
        
        <p className="mt-8 text-center font-serif text-sm border-t border-black pt-6">
          {isLogin ? "Not on the mailing list yet? " : "Already have a subscription? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-black uppercase tracking-wider hover:underline decoration-2 underline-offset-4"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;

