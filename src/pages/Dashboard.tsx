import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import {
  Settings, LogOut, FileText, Bookmark, Trash2,
  PenSquare, Eye, ThumbsUp, Clock, TrendingUp, UserCircle
} from 'lucide-react';
import { getPostsByAuthor, deletePost, getUserProfile, type BlogPost, type UserProfile } from '../lib/db';

type TabKey = 'published' | 'drafts';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('published');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [fetchedPosts, fetchedProfile] = await Promise.all([
          getPostsByAuthor(user.uid),
          getUserProfile(user.uid)
        ]);
        setPosts(fetchedPosts);
        setProfile(fetchedProfile);
      } catch (e) {
        console.error('Failed to fetch data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDelete = async (postId: string) => {
    if (!confirm('Retract this article permanently?')) return;
    try {
      await deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (e) {
      console.error(e);
      alert('Failed to delete post.');
    }
  };

  if (!user) return <Navigate to="/auth" />;

  const published = posts.filter(p => !p.isDraft);
  const drafts = posts.filter(p => p.isDraft);

  const totalViews = published.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const totalLikes = published.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  const displayName = profile?.displayName || user.email?.split('@')[0] || 'Writer';

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[80vh]">

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="w-full md:w-60 flex-shrink-0 flex flex-col gap-3">

        {/* Profile Card */}
        <div className="border border-card-border bg-card p-5 flex flex-col items-center text-center">
          <div className="relative mb-4">
            {profile?.photoURL && profile.photoURL.trim() !== '' ? (
              <img
                src={profile.photoURL}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-card-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-card-border bg-background flex items-center justify-center">
                <UserCircle className="w-9 h-9 text-gray-700" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <h2 className="text-sm font-bold font-heading text-foreground truncate w-full">{displayName}</h2>
          <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">{profile?.role || 'Contributor'}</p>
          <div className="mt-3 pt-3 border-t border-card-border w-full grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-black font-heading text-foreground">{published.length}</div>
              <div className="text-[9px] uppercase tracking-widest text-gray-600">Articles</div>
            </div>
            <div>
              <div className="text-lg font-black font-heading text-foreground">{profile?.followers?.length || 0}</div>
              <div className="text-[9px] uppercase tracking-widest text-gray-600">Followers</div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="border border-card-border bg-card flex flex-col overflow-hidden">
          <button
            onClick={() => setActiveTab('published')}
            className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-bold uppercase tracking-widest border-b border-card-border transition-all ${
              activeTab === 'published' ? 'text-foreground border-l-2 border-l-primary pl-3' : 'text-gray-500 hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            My Articles
            {published.length > 0 && (
              <span className="ml-auto text-[9px] bg-card-border px-1.5 py-0.5">{published.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-bold uppercase tracking-widest border-b border-card-border transition-all ${
              activeTab === 'drafts' ? 'text-foreground border-l-2 border-l-primary pl-3' : 'text-gray-500 hover:text-foreground'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Drafts
            {drafts.length > 0 && (
              <span className="ml-auto text-[9px] bg-card-border px-1.5 py-0.5">{drafts.length}</span>
            )}
          </button>
          <Link
            to="/settings"
            className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-foreground border-b border-card-border transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Account Settings
          </Link>
          <Link
            to={`/profile/${user.uid}`}
            className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-foreground border-b border-card-border transition-all"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Public Profile
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-red-400 transition-all mt-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="flex-1 flex flex-col gap-5 min-w-0">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-card-border pb-5 gap-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary mb-1">● The Voices</div>
            <h1 className="text-2xl font-black font-heading uppercase text-foreground">Editorial Desk</h1>
          </div>
          <Link
            to="/write"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all"
          >
            <PenSquare className="w-3.5 h-3.5" />
            Draft New Story
          </Link>
        </div>

        {/* Stats Row */}
        {!loading && published.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Published', value: published.length, icon: FileText, color: 'text-blue-400' },
              { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-green-400' },
              { label: 'Likes', value: totalLikes, icon: ThumbsUp, color: 'text-primary' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="border border-card-border bg-card p-4 flex items-center gap-3">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <div>
                  <div className="text-xl font-black font-heading text-foreground">{value}</div>
                  <div className="text-[9px] uppercase tracking-widest text-gray-600">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="py-20 text-center text-xs font-bold uppercase tracking-widest text-gray-600 animate-pulse">
            ● Searching Archives...
          </div>

        ) : activeTab === 'published' ? (
          published.length === 0 ? (
            <div className="border border-card-border bg-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center mb-5">
                <FileText className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-xl font-black font-heading mb-3 uppercase text-foreground">Your Typewriter is Silent</h3>
              <p className="font-sans text-sm text-gray-500 mb-6 max-w-xs">
                You haven't published any articles yet. The front page needs your voice.
              </p>
              <Link to="/write" className="btn-premium px-6 py-2.5 text-xs">
                Begin Writing
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {published.map(post => (
                <div
                  key={post.id}
                  className="border border-card-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/5 transition-colors group"
                >
                  {post.coverImageURL && (
                    <img
                      src={post.coverImageURL}
                      alt={post.title}
                      className="w-full md:w-20 h-16 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.category && (
                        <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-primary/10 text-primary">
                          {post.category}
                        </span>
                      )}
                      {(post.viewsCount ?? 0) > 20 && (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1">
                          <TrendingUp className="w-2.5 h-2.5" /> Trending
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold font-heading text-foreground truncate group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                      <span>{new Date(post.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{post.viewsCount || 0}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" />{post.likesCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/post/${post.id}`}
                      className="px-3 py-1.5 border border-card-border text-[10px] font-bold uppercase text-gray-500 hover:text-foreground hover:border-foreground transition-all"
                    >
                      View
                    </Link>
                    <Link
                      to={`/edit/${post.id}`}
                      className="px-3 py-1.5 border border-card-border text-[10px] font-bold uppercase text-gray-500 hover:text-foreground hover:border-foreground transition-all flex items-center gap-1"
                    >
                      <PenSquare className="w-3 h-3" /> Edit
                    </Link>
                    <button
                      onClick={() => post.id && handleDelete(post.id)}
                      className="px-3 py-1.5 border border-red-900/50 text-[10px] font-bold uppercase text-red-600 hover:bg-red-950/30 transition-all flex items-center gap-1"
                      title="Retract Article"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )

        ) : (
          // Drafts Tab
          drafts.length === 0 ? (
            <div className="border border-card-border bg-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center mb-5">
                <Clock className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-xl font-black font-heading mb-3 uppercase text-foreground">No Drafts in Progress</h3>
              <p className="font-sans text-sm text-gray-500 mb-6 max-w-xs">
                Start a new draft and come back to finish it whenever you're ready.
              </p>
              <Link to="/write" className="btn-premium px-6 py-2.5 text-xs">Start a Draft</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {drafts.map(post => (
                <div
                  key={post.id}
                  className="border border-card-border border-dashed bg-card/50 p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600 mb-1 block">● Draft</span>
                    <h3 className="text-base font-bold font-heading text-gray-400 truncate">
                      {post.title || 'Untitled Draft'}
                    </h3>
                    <p className="text-[10px] text-gray-700 font-sans mt-1">
                      Last edited: {new Date(post.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/edit/${post.id}`}
                      className="px-4 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all"
                    >
                      Continue
                    </Link>
                    <button
                      onClick={() => post.id && handleDelete(post.id)}
                      className="p-1.5 border border-red-900/50 text-red-600 hover:bg-red-950/30 transition-all"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Dashboard;
