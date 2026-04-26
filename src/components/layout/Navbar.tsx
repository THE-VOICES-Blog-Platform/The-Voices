import { Link } from 'react-router-dom';
import { Search, Menu, PenSquare, User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_UID } from '../../lib/moderation';

const Navbar = () => {
  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <nav className="w-full pt-8 px-4 md:px-8 flex flex-col items-center border-b-[6px] border-black pb-4 mb-8">
      {/* Date Header */}
      <div className="w-full flex justify-between items-center text-xs uppercase tracking-widest font-bold border-b border-t border-black py-1 mb-6">
        <span>Vol. 1, No. 1</span>
        <span>{today}</span>
        <span>Fifty Cents</span>
      </div>

      {/* The Masthead */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-between mb-4 gap-4 lg:gap-0">
        {/* Left: Quote (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col items-start flex-1">
          <p className="font-serif italic text-sm text-gray-600">"All the news that fits our aesthetic"</p>
        </div>
        
        {/* Center: Logo */}
        <Link to="/" className="flex-shrink-0 flex justify-center hover:opacity-80 transition-opacity z-10 px-2 lg:px-4">
          <h1 className="text-5xl md:text-6xl font-black font-heading tracking-tighter uppercase text-center leading-none" style={{ transform: 'scaleY(1.1)' }}>
            The Voices
          </h1>
        </Link>
        
        {/* Right: Actions */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end flex-1 gap-2 md:gap-4 w-full lg:w-auto z-20">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
              if (q.trim()) window.location.href = `/search?q=${encodeURIComponent(q.trim())}`;
            }}
            className="flex items-center border border-black px-2 py-1 bg-white focus-within:ring-1 focus-within:ring-black max-w-[140px] md:max-w-none"
          >
            <input 
              name="search"
              type="text" 
              placeholder="SEARCH..." 
              className="w-full md:w-32 bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none placeholder:text-gray-400"
            />
            <button type="submit" className="p-1 hover:bg-black hover:text-[#f4f1ea] transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>
          {isAdmin && (
            <Link to="/admin" title="Admin Panel" className="p-1 border-2 border-transparent hover:border-black hover:bg-black hover:text-[#f4f1ea] transition-colors">
              <Shield className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          )}
          <Link to="/write" className="btn-outline flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-[10px] md:text-xs whitespace-nowrap">
            <PenSquare className="w-3 h-3 md:w-4 md:h-4" />
            Write
          </Link>
          <Link to={user ? "/settings" : "/auth"} className="btn-premium flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-[10px] md:text-xs whitespace-nowrap">
            <User className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden md:inline">{user ? 'Account' : 'Log In / Join'}</span>
            <span className="md:hidden">{user ? 'Me' : 'Join'}</span>
          </Link>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="w-full border-t-[3px] border-b border-black py-2 mt-4 flex justify-center gap-6 md:gap-12 overflow-x-auto whitespace-nowrap px-4">
        {['World', 'Politics', 'Business', 'Technology', 'Science', 'Health', 'Sports', 'Arts'].map((cat) => (
          <Link key={cat} to={`/category/${cat.toLowerCase()}`} className="uppercase font-bold text-xs tracking-widest hover:underline decoration-2 underline-offset-4">
            {cat}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
