import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-2 border-black px-4 py-3 text-black font-mono focus:outline-none focus:bg-black focus:text-white transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-4 mt-4 border-4 border-black bg-black text-[#f4f1ea] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-transparent hover:text-black transition-colors"
          >
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
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
