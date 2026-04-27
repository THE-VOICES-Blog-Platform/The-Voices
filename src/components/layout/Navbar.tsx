import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PenSquare, User, Shield, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_UID } from '../../lib/moderation';
import { getUserNotifications, markAllNotificationsRead, type AppNotification } from '../../lib/db';

const Navbar = () => {
  const { user, profile } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID || profile?.isAdmin;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const notifs = await getUserNotifications(user.uid);
      setNotifications(notifs);
    };
    fetchNotifs();
    // In a real app we'd use onSnapshot, but polling or just fetching on mount is fine for now
  }, [user]);

  const handleNotificationsClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0 && user) {
      await markAllNotificationsRead(user.uid);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <nav className="w-full pt-8 px-4 md:px-8 flex flex-col items-center border-b-[6px] border-black pb-4 mb-8">
      {/* Date Header */}
      <div className="w-full flex justify-between items-center text-xs uppercase tracking-widest font-bold border-b border-t border-black py-1 mb-6">
        <span>Vol. 1, No. 1</span>
        <span>{today}</span>
        <span>Fifty Cents</span>
      </div>

      {/* The Masthead */}
      <div className="w-full flex flex-col items-center mb-6">
        
        {/* Center: Logo (Full Width Row) */}
        <Link to="/" className="w-full flex justify-center hover:opacity-80 transition-opacity mb-6">
          <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black font-heading tracking-tighter uppercase text-center leading-none" style={{ transform: 'scaleY(1.1)' }}>
            The Voices
          </h1>
        </Link>
        
        {/* Actions & Quote Row */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 border-t-2 border-b-2 border-black py-3 px-2">
          
          {/* Left: Quote */}
          <div className="hidden md:block">
            <p className="font-serif italic text-base md:text-lg text-gray-800 tracking-wide pr-4">"All the news that fits our aesthetic"</p>
          </div>
          
          {/* Right: Actions */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4 w-full md:w-auto">
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
            
            {user && (
              <div className="relative">
                <button 
                  onClick={handleNotificationsClick}
                  className="p-1 border-2 border-transparent hover:border-black hover:bg-black hover:text-[#f4f1ea] transition-colors relative"
                >
                  <Bell className="w-4 h-4 md:w-5 md:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                    <div className="p-2 border-b-2 border-black font-bold uppercase text-xs tracking-widest bg-gray-100">
                      Alerts
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs font-serif italic text-gray-500">No new alerts.</div>
                      ) : (
                        notifications.map(n => (
                          <Link 
                            key={n.id} 
                            to={n.link || '#'} 
                            className={`block p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                            onClick={() => setShowNotifications(false)}
                          >
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1">{n.title}</div>
                            <div className="text-xs font-serif">{n.message}</div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link to="/write" className="btn-outline flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs whitespace-nowrap">
              <PenSquare className="w-3 h-3 md:w-4 md:h-4" />
              Write
            </Link>
            <Link to={user ? "/settings" : "/auth"} className="btn-premium flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs whitespace-nowrap">
              <User className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">{user ? 'Account' : 'Log In / Join'}</span>
              <span className="md:hidden">{user ? 'Me' : 'Join'}</span>
            </Link>
          </div>
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
