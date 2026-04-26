import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Settings, LogOut, FileText, Bookmark, Trash2, PenSquare } from 'lucide-react';
import { getPostsByAuthor, deletePost, getUserProfile, type BlogPost, type UserProfile } from '../lib/db';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Failed to fetch data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to retract this article?')) return;
    try {
      await deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (e) {
      console.error(e);
      alert("Failed to delete post.");
    }
  };

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[70vh]">
      {/* Sidebar - The Editorial Office */}
      <aside className="w-full md:w-64 flex flex-col gap-6">
        <div className="border-4 border-black p-6 flex flex-col items-center text-center bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-24 h-24 border-4 border-black mb-4 overflow-hidden bg-gray-100 flex items-center justify-center">
            {profile?.photoURL && profile.photoURL.trim() !== '' ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black font-heading">
                {(profile?.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold font-heading truncate w-full uppercase">
            {profile?.displayName || user.email?.split('@')[0]}
          </h2>
          <p className="text-xs uppercase tracking-widest border-t border-black pt-2 mt-2 w-full font-bold">
            {profile?.role || 'Staff Writer'}
          </p>
        </div>

        <div className="border-2 border-black flex flex-col bg-white">
          <button className="flex items-center gap-3 w-full p-4 hover:bg-gray-100 transition-colors border-b-2 border-black font-bold uppercase text-sm">
            <FileText className="w-5 h-5" />
            <span className="tracking-wider">My Articles</span>
          </button>
          <button className="flex items-center gap-3 w-full p-4 hover:bg-gray-100 transition-colors border-b border-black font-bold uppercase text-sm text-gray-600">
            <Bookmark className="w-5 h-5" />
            <span className="tracking-wider">Saved Clippings</span>
          </button>
          <Link to="/settings" className="flex items-center gap-3 w-full p-4 hover:bg-gray-100 transition-colors border-b border-black font-bold uppercase text-sm text-gray-600">
            <Settings className="w-5 h-5" />
            <span className="tracking-wider">Preferences</span>
          </Link>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full p-4 hover:bg-black hover:text-[#f4f1ea] transition-colors font-bold uppercase text-sm mt-auto"
          >
            <LogOut className="w-5 h-5" />
            <span className="tracking-wider">Resign (Log Out)</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 border-black pb-4 mb-8">
          <h1 className="text-4xl font-black font-heading uppercase">Editorial Desk</h1>
          <Link to="/write" className="mt-4 md:mt-0 px-6 py-2 border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#f4f1ea] transition-colors flex items-center gap-2">
            <PenSquare className="w-4 h-4" />
            Draft New Story
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="text-xl font-bold font-heading uppercase tracking-widest animate-pulse">Searching Archives...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="border-2 border-black p-12 flex flex-col items-center justify-center text-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center mb-6">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black font-heading mb-4 uppercase">Your Typewriter is Silent</h3>
            <p className="font-serif text-lg mb-8 max-w-md text-gray-700">
              You haven't submitted any articles to the publisher yet. The front page needs your voice.
            </p>
            <Link to="/write" className="px-8 py-3 bg-black text-[#f4f1ea] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
              Begin Writing
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <h3 className="font-bold uppercase tracking-widest text-sm border-b border-black pb-2">Published Works</h3>
            {posts.map(post => (
              <div key={post.id} className="border-2 border-black p-6 bg-white flex flex-col md:flex-row md:items-center justify-between group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-2xl font-black font-heading truncate mb-2">{post.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase text-gray-600 tracking-wider">
                    <span>Published: {new Date(post.createdAt.toMillis()).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.likesCount} Recommendations</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <Link to={`/edit/${post.id}`} className="p-2 text-black hover:bg-black hover:text-[#f4f1ea] border border-black transition-colors" title="Edit Article">
                    <PenSquare className="w-5 h-5" />
                  </Link>
                  <button onClick={() => post.id && handleDelete(post.id)} className="p-2 text-black hover:bg-black hover:text-[#f4f1ea] border border-black transition-colors" title="Retract Article">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
