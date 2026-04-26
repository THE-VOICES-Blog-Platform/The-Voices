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
      <div className="w-full flex flex-col md:flex-row items-center justify-between mb-4">
        <div className="hidden md:flex flex-col items-start w-1/4">
          <p className="font-serif italic text-sm">"All the news that fits our aesthetic"</p>
        </div>
        
        <Link to="/" className="w-full md:w-1/2 flex justify-center hover:opacity-80 transition-opacity">
          <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tighter uppercase text-center leading-none" style={{ transform: 'scaleY(1.1)' }}>
            The Voices
          </h1>
        </Link>
        
        <div className="flex items-center justify-end w-full md:w-1/4 gap-4 mt-4 md:mt-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
              if (q.trim()) window.location.href = `/search?q=${encodeURIComponent(q.trim())}`;
            }}
            className="flex items-center border border-black px-2 py-1 bg-white focus-within:ring-1 focus-within:ring-black"
          >
            <input 
              name="search"
              type="text" 
              placeholder="SEARCH..." 
              className="w-24 md:w-32 bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none placeholder:text-gray-400"
            />
            <button type="submit" className="p-1 hover:bg-black hover:text-[#f4f1ea] transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>
          {isAdmin && (
            <Link to="/admin" title="Admin Panel" className="p-1 hover:bg-black hover:text-[#f4f1ea] transition-colors border border-transparent">
              <Shield className="w-5 h-5" />
            </Link>
          )}
          <Link to="/write" className="flex items-center gap-2 px-3 py-1 border-2 border-black font-bold uppercase text-xs hover:bg-black hover:text-[#f4f1ea] transition-colors">
            <PenSquare className="w-4 h-4" />
            Write
          </Link>
          <Link to={user ? "/settings" : "/auth"} className="p-1 hover:bg-black hover:text-[#f4f1ea] transition-colors border border-transparent">
            <User className="w-5 h-5" />
          </Link>
          <button className="md:hidden p-1 hover:bg-black hover:text-[#f4f1ea] transition-colors">
            <Menu className="w-5 h-5" />
          </button>
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
