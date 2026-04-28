import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PenSquare, User, Shield, Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_UID } from '../../lib/moderation';
import { getUserNotifications, markAllNotificationsRead, type AppNotification } from '../../lib/db';

const Navbar = () => {
  const { user, profile } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID || profile?.isAdmin;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const notifs = await getUserNotifications(user.uid);
      setNotifications(notifs);
    };
    fetchNotifs();
  }, [user]);

  const handleNotificationsClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0 && user) {
      await markAllNotificationsRead(user.uid);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  const CATEGORIES = ['World', 'India', 'Politics', 'Business', 'Technology', 'Science', 'Health', 'Sports', 'Arts'];

  return (
    <nav className="w-full sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border">
      {/* Top ticker bar */}
      <div className="w-full flex justify-between items-center text-[10px] uppercase tracking-widest font-semibold border-b border-card-border py-1.5 px-4 md:px-8 text-gray-400">
        <span>Vol. 1, No. 1</span>
        <span className="hidden md:block">{today}</span>
        <span className="text-primary font-bold">● LIVE</span>
      </div>

      {/* Masthead */}
      <div className="w-full flex flex-col items-center px-4 md:px-8 pt-5 pb-4">
        {/* Logo */}
        <Link to="/" className="w-full flex flex-col items-center hover:opacity-90 transition-opacity mb-1 group">
          <h1
            className="text-5xl md:text-7xl lg:text-[6.5rem] font-black font-heading tracking-tighter uppercase text-center leading-none text-foreground group-hover:text-primary transition-colors duration-300"
            style={{ letterSpacing: '-0.04em' }}
          >
            The Voices
          </h1>
          <p className="font-sans italic text-xs md:text-sm text-gray-400 mt-1 tracking-widest uppercase">
            Stories That Don't Get Headlines
          </p>
        </Link>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-card-border" />
          <span className="text-primary text-xs font-bold uppercase tracking-widest">The Voices</span>
          <div className="flex-1 h-px bg-card-border" />
        </div>

        {/* Action Row */}
        <div className="w-full flex items-center justify-between gap-3">
          {/* Left: Tagline */}
          <p className="hidden md:block font-sans italic text-xs text-gray-500 tracking-wide max-w-xs">
            "While the world scrolls noise, we decode what actually matters."
          </p>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3 w-full md:w-auto">
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 border border-card-border text-gray-400 hover:text-foreground hover:border-foreground transition-all"
              aria-label="Search"
            >
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {isAdmin && (
              <Link to="/admin" title="Admin Panel" className="p-2 border border-card-border text-gray-400 hover:text-primary hover:border-primary transition-all">
                <Shield className="w-4 h-4" />
              </Link>
            )}

            {user && (
              <div className="relative">
                <button
                  onClick={handleNotificationsClick}
                  className="p-2 border border-card-border text-gray-400 hover:text-foreground hover:border-foreground transition-all relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border border-background" />
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-card-border shadow-2xl z-50">
                    <div className="p-2 border-b border-card-border font-bold uppercase text-xs tracking-widest text-gray-400 flex justify-between items-center px-3">
                      <span>Alerts</span>
                      {unreadCount > 0 && <span className="text-primary">{unreadCount} new</span>}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs font-sans italic text-gray-500">No new alerts.</div>
                      ) : (
                        notifications.map(n => (
                          <Link
                            key={n.id}
                            to={n.link || '#'}
                            className={`block p-3 border-b border-card-border hover:bg-white/5 transition-colors ${!n.isRead ? 'border-l-2 border-l-primary' : ''}`}
                            onClick={() => setShowNotifications(false)}
                          >
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-400">{n.title}</div>
                            <div className="text-xs font-sans text-foreground">{n.message}</div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link to="/write" className="flex items-center gap-1.5 px-3 py-1.5 border border-card-border text-gray-300 hover:text-foreground hover:border-foreground transition-all text-[10px] font-bold uppercase tracking-widest">
              <PenSquare className="w-3 h-3" />
              Write
            </Link>
            <Link
              to={user ? "/settings" : "/auth"}
              className="btn-premium flex items-center gap-1.5 px-4 py-1.5 text-[10px] whitespace-nowrap"
            >
              <User className="w-3 h-3" />
              <span className="hidden md:inline">{user ? 'Account' : 'Log In / Join'}</span>
              <span className="md:hidden">{user ? 'Me' : 'Join'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search bar (expandable) */}
      {showSearch && (
        <div className="border-t border-card-border px-4 md:px-8 py-3 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
              if (q.trim()) { window.location.href = `/search?q=${encodeURIComponent(q.trim())}`; setShowSearch(false); }
            }}
            className="flex items-center gap-3 max-w-xl mx-auto"
          >
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              name="search"
              type="text"
              autoFocus
              placeholder="Search stories, topics, authors..."
              className="w-full bg-transparent text-sm font-sans text-foreground focus:outline-none placeholder:text-gray-600 border-b border-card-border pb-1"
            />
            <button type="submit" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">Go</button>
          </form>
        </div>
      )}

      {/* Categories Bar */}
      <div className="w-full border-t border-card-border py-2 flex justify-start md:justify-center gap-5 md:gap-8 overflow-x-auto whitespace-nowrap px-4 md:px-8 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            to={`/category/${cat.toLowerCase()}`}
            className={`uppercase font-semibold text-[10px] tracking-widest transition-colors pb-1 border-b-2 ${
              cat === 'India'
                ? 'border-[#FF9933] text-[#FF9933] hover:text-[#FF9933]'
                : 'border-transparent text-gray-400 hover:text-foreground hover:border-primary'
            }`}
          >
            {cat === 'India' ? '🇮🇳 India' : cat}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
