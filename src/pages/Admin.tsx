import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllPosts, getAllUsers, deletePost, banUser, unbanUser, setUserRole, type BlogPost, type UserProfile, ROLES } from '../lib/db';
import { ADMIN_UID } from '../lib/moderation';
import { Shield, Trash2, Ban, UserCheck, ArrowLeft, Newspaper, Users, Star } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'roles'>('posts');
  const [loading, setLoading] = useState(true);
  const [banReason, setBanReason] = useState('');
  const [banningUid, setBanningUid] = useState<string | null>(null);

  const isOwner = user?.uid === ADMIN_UID;

  // Allow secondary admins too
  const currentUserProfile = users.find(u => u.uid === user?.uid);
  const canAccess = isOwner || currentUserProfile?.isAdmin;

  if (!user || (!loading && !canAccess)) return <Navigate to="/" />;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPosts, fetchedUsers] = await Promise.all([getAllPosts(), getAllUsers()]);
        setPosts(fetchedPosts);
        setUsers(fetchedUsers);
      } catch (e) { console.error("Admin fetch error:", e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Retract this article permanently?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch { alert('Failed to delete post.'); }
  };

  const handleBan = async (uid: string) => {
    const reason = banReason || 'Violation of community standards.';
    try {
      await banUser(uid, reason);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, banned: true, bannedReason: reason } : u));
      setBanningUid(null); setBanReason('');
    } catch { alert('Failed to ban user.'); }
  };

  const handleUnban = async (uid: string) => {
    try {
      await unbanUser(uid);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, banned: false, violationCount: 0 } : u));
    } catch { alert('Failed to unban user.'); }
  };

  const handleRoleChange = async (uid: string, role: string, makeAdmin: boolean) => {
    try {
      await setUserRole(uid, role, makeAdmin);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role, isAdmin: makeAdmin } : u));
    } catch { alert('Failed to update role.'); }
  };

  const tabs = [
    { key: 'posts', label: 'All Articles', icon: Newspaper },
    { key: 'users', label: 'User Management', icon: Users },
    ...(isOwner ? [{ key: 'roles', label: 'Roles & Titles', icon: Star }] : []),
  ] as { key: 'posts' | 'users' | 'roles'; label: string; icon: typeof Newspaper }[];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="border-b-4 border-black pb-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Shield className="w-8 h-8" />
          <div>
            <h1 className="text-4xl font-black font-heading uppercase">
              {isOwner ? 'Owner Panel' : 'Editorial Panel'}
            </h1>
            <p className="font-serif italic text-sm text-gray-600">Restricted access — Administrative control</p>
          </div>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 border-2 border-black px-4 py-2 font-bold uppercase text-sm hover:bg-black hover:text-[#f4f1ea] transition-colors w-max">
          <ArrowLeft className="w-4 h-4" /> Return to Front Page
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Articles', value: posts.length, icon: Newspaper },
          { label: 'Total Users', value: users.length, icon: Users },
          { label: 'Banned Users', value: users.filter(u => u.banned).length, icon: Ban },
          { label: 'Violations', value: users.reduce((acc, u) => acc + (u.violationCount || 0), 0), icon: Shield },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center">
            <Icon className="w-6 h-6 mb-2" />
            <div className="text-3xl font-black font-heading">{value}</div>
            <div className="text-xs uppercase font-bold tracking-widest text-gray-600 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black mb-8">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-6 py-3 font-black uppercase tracking-widest text-sm transition-colors ${activeTab === key ? 'bg-black text-[#f4f1ea]' : 'hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 font-heading font-black text-2xl uppercase animate-pulse">Accessing Archives...</div>
      ) : activeTab === 'posts' ? (
        <div className="flex flex-col gap-4">
          {posts.map(post => (
            <div key={post.id} className="border-2 border-black p-5 bg-white flex flex-col md:flex-row md:items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black font-heading truncate">{post.title}</h3>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-600 mt-1">
                  {post.authorEmail} · {new Date(post.createdAt.toMillis()).toLocaleDateString()} · {post.likesCount} Likes
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link to={`/post/${post.id}`} className="px-3 py-2 border border-black text-xs font-bold uppercase hover:bg-gray-100 transition-colors">Read</Link>
                <button onClick={() => post.id && handleDeletePost(post.id)}
                  className="px-3 py-2 border-2 border-black bg-black text-[#f4f1ea] text-xs font-bold uppercase hover:bg-gray-800 flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Retract
                </button>
              </div>
            </div>
          ))}
        </div>

      ) : activeTab === 'users' ? (
        <div className="flex flex-col gap-4">
          {users.map(u => (
            <div key={u.uid} className={`border-2 p-5 bg-white flex flex-col md:flex-row md:items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${u.banned ? 'border-gray-400 opacity-70' : 'border-black'}`}>
              <div className="flex items-center gap-3 flex-shrink-0">
                {u.photoURL
                  ? <img src={u.photoURL} className="w-12 h-12 border-2 border-black object-cover" alt={u.displayName} />
                  : <div className="w-12 h-12 border-2 border-black bg-gray-100 flex items-center justify-center text-xl font-black">{u.displayName?.[0]?.toUpperCase()}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-lg font-black font-heading">{u.displayName || u.email}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-black">{u.uid === ADMIN_UID ? 'Owner' : u.role}</span>
                  {u.isAdmin && u.uid !== ADMIN_UID && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-black text-[#f4f1ea]">Admin</span>}
                  {u.banned && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black">Banned</span>}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-600">
                  {u.email} · Violations: {u.violationCount || 0}
                  {u.bannedReason && ` · ${u.bannedReason}`}
                </div>
              </div>
              {/* Owner can ban; secondary admins cannot */}
              {isOwner && u.uid !== ADMIN_UID && (
                <div className="flex-shrink-0">
                  {u.banned ? (
                    <button onClick={() => handleUnban(u.uid)} className="px-4 py-2 border-2 border-black text-xs font-black uppercase hover:bg-gray-100 flex items-center gap-1">
                      <UserCheck className="w-4 h-4" /> Reinstate
                    </button>
                  ) : banningUid === u.uid ? (
                    <div className="flex flex-col gap-2">
                      <input type="text" placeholder="Reason..." value={banReason} onChange={e => setBanReason(e.target.value)} className="border-2 border-black px-2 py-1 text-xs font-mono focus:outline-none" />
                      <div className="flex gap-2">
                        <button onClick={() => handleBan(u.uid)} className="flex-1 px-3 py-1 bg-black text-[#f4f1ea] text-xs font-black uppercase">Confirm</button>
                        <button onClick={() => setBanningUid(null)} className="flex-1 px-3 py-1 border border-black text-xs font-black uppercase">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setBanningUid(u.uid)} className="px-4 py-2 border-2 border-black bg-black text-[#f4f1ea] text-xs font-black uppercase hover:bg-gray-800 flex items-center gap-1">
                      <Ban className="w-4 h-4" /> Ban
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      ) : (
        /* Roles Tab — Owner only */
        <div className="flex flex-col gap-4">
          <p className="font-serif italic text-gray-600 border-b border-black pb-4 mb-2">Assign titles and admin powers to your team. Only you can do this.</p>
          {users.filter(u => u.uid !== ADMIN_UID).map(u => (
            <div key={u.uid} className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3 flex-shrink-0">
                {u.photoURL
                  ? <img src={u.photoURL} className="w-12 h-12 border-2 border-black object-cover" alt={u.displayName} />
                  : <div className="w-12 h-12 border-2 border-black bg-gray-100 flex items-center justify-center text-xl font-black">{u.displayName?.[0]?.toUpperCase()}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black font-heading">{u.displayName || u.email}</h3>
                <p className="text-xs text-gray-500 font-mono">{u.email}</p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 flex-shrink-0 items-start md:items-center">
                <select
                  value={u.role || 'Contributor'}
                  onChange={e => handleRoleChange(u.uid, e.target.value, u.isAdmin)}
                  className="border-2 border-black px-3 py-2 font-bold uppercase text-xs bg-white focus:outline-none cursor-pointer"
                >
                  {ROLES.filter(r => r !== 'Owner').map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <label className="flex items-center gap-2 font-bold uppercase text-xs cursor-pointer border-2 border-black px-3 py-2 hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={u.isAdmin || false}
                    onChange={e => handleRoleChange(u.uid, u.role, e.target.checked)}
                    className="w-4 h-4 border border-black accent-black"
                  />
                  Admin Access
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
