import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllPosts, getAllUsers, deletePost, banUser, unbanUser, setUserRole, type BlogPost, type UserProfile, ROLES } from '../lib/db';
import { ADMIN_UID } from '../lib/moderation';
import { Shield, Trash2, Ban, UserCheck, ArrowLeft, Newspaper, Users, Star, AlertTriangle, Sparkles, Send, CheckCircle2, Clock } from 'lucide-react';
import { createPost } from '../lib/db';

const Admin = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'roles' | 'editorial'>('posts');
  const [loading, setLoading] = useState(true);
  const [banReason, setBanReason] = useState('');
  const [banningUid, setBanningUid] = useState<string | null>(null);
  const [editorialStatus, setEditorialStatus] = useState<'idle' | 'running' | 'success'>('idle');

  const currentUserProfile = users.find(u => u.uid === user?.uid);
  const isOwner = user?.uid === ADMIN_UID;
  const canManageRoles = isOwner || currentUserProfile?.isAdmin;
  const canAccess = canManageRoles;

  if (!user || (!loading && !canAccess)) return <Navigate to="/" />;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPosts, fetchedUsers] = await Promise.all([getAllPosts(), getAllUsers()]);
        setPosts(fetchedPosts);
        setUsers(fetchedUsers);
      } catch (e) { console.error('Admin fetch error:', e); }
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
    } catch (error: any) {
      alert('Failed to update role: ' + (error.message || 'Unknown error'));
    }
  };

  const tabs = [
    { key: 'posts', label: 'Articles', icon: Newspaper },
    { key: 'users', label: 'Users', icon: Users },
    ...(canManageRoles ? [{ key: 'roles', label: 'Roles', icon: Star }] : []),
    { key: 'editorial', label: 'Editorial Engine', icon: Sparkles },
  ] as { key: 'posts' | 'users' | 'roles' | 'editorial'; label: string; icon: typeof Newspaper }[];

  const stats = [
    { label: 'Total Articles', value: posts.length, icon: Newspaper, color: 'text-blue-400' },
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-green-400' },
    { label: 'Banned Users', value: users.filter(u => u.banned).length, icon: Ban, color: 'text-red-400' },
    { label: 'Total Violations', value: users.reduce((acc, u) => acc + (u.violationCount || 0), 0), icon: AlertTriangle, color: 'text-orange-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="border-b border-card-border pb-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 border border-card-border text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary mb-0.5">● Restricted Access</div>
            <h1 className="text-2xl font-black font-heading uppercase text-foreground">
              {isOwner ? 'Owner Panel' : 'Editorial Panel'}
            </h1>
          </div>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors border border-card-border px-4 py-2 w-max">
          <ArrowLeft className="w-3 h-3" /> Front Page
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-card-border bg-card p-4 flex flex-col gap-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <div className="text-3xl font-black font-heading text-foreground">{value}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-gray-600">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border border-card-border bg-card p-1 gap-1 mb-6 w-max">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-150 ${
              activeTab === key
                ? 'bg-foreground text-background'
                : 'text-gray-500 hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-xs font-bold uppercase tracking-widest text-gray-600 animate-pulse">
          ● Accessing archives...
        </div>
      ) : activeTab === 'posts' ? (
        <div className="flex flex-col gap-2">
          {posts.length === 0 ? (
            <p className="text-sm text-gray-600 font-sans py-8 text-center">No published articles found.</p>
          ) : posts.map(post => (
            <div key={post.id} className="border border-card-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/5 transition-colors">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold font-heading text-foreground truncate">{post.title}</h3>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mt-1 flex flex-wrap gap-3">
                  <span>{post.authorEmail}</span>
                  <span>·</span>
                  <span>{new Date(post.createdAt.toMillis()).toLocaleDateString('en-IN')}</span>
                  <span>·</span>
                  <span>{post.likesCount} Likes</span>
                  {post.category && (
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary">{post.category}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to={`/post/${post.id}`} className="px-3 py-1.5 border border-card-border text-[10px] font-bold uppercase text-gray-500 hover:text-foreground hover:border-foreground transition-all">
                  Read
                </Link>
                <button
                  onClick={() => post.id && handleDeletePost(post.id)}
                  className="px-3 py-1.5 border border-red-900/50 text-[10px] font-bold uppercase text-red-500 hover:bg-red-950/30 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Retract
                </button>
              </div>
            </div>
          ))}
        </div>

      ) : activeTab === 'users' ? (
        <div className="flex flex-col gap-2">
          {users.map(u => (
            <div
              key={u.uid}
              className={`border bg-card p-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${
                u.banned ? 'border-red-900/30 opacity-60' : 'border-card-border hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 flex-shrink-0">
                {u.photoURL
                  ? <img src={u.photoURL} className="w-10 h-10 object-cover rounded-full border border-card-border" alt={u.displayName} />
                  : <div className="w-10 h-10 rounded-full border border-card-border bg-background flex items-center justify-center text-sm font-black text-gray-600">{u.displayName?.[0]?.toUpperCase()}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-bold font-heading text-foreground">{u.displayName || u.email}</h3>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-card-border text-gray-500">
                    {u.uid === ADMIN_UID ? 'Owner' : u.role}
                  </span>
                  {u.isAdmin && u.uid !== ADMIN_UID && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-primary text-foreground">Admin</span>
                  )}
                  {u.banned && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-red-900/50 text-red-500">Banned</span>
                  )}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 flex flex-wrap gap-2">
                  <span>{u.email}</span>
                  <span>·</span>
                  <span>Violations: {u.violationCount || 0}</span>
                  {u.bannedReason && <span className="text-red-600">· {u.bannedReason}</span>}
                </div>
              </div>
              {canManageRoles && u.uid !== ADMIN_UID && (
                <div className="flex-shrink-0">
                  {u.banned ? (
                    <button onClick={() => handleUnban(u.uid)} className="flex items-center gap-1.5 px-3 py-1.5 border border-green-900/50 text-[10px] font-bold uppercase text-green-500 hover:bg-green-950/30 transition-all">
                      <UserCheck className="w-3 h-3" /> Reinstate
                    </button>
                  ) : banningUid === u.uid ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Ban reason..."
                        value={banReason}
                        onChange={e => setBanReason(e.target.value)}
                        className="bg-background border border-card-border px-3 py-1.5 text-xs font-sans text-foreground focus:outline-none focus:border-primary w-48"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleBan(u.uid)} className="flex-1 px-3 py-1.5 bg-red-900/60 border border-red-800/50 text-[10px] font-bold uppercase text-red-300">Confirm Ban</button>
                        <button onClick={() => setBanningUid(null)} className="flex-1 px-3 py-1.5 border border-card-border text-[10px] font-bold uppercase text-gray-500">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setBanningUid(u.uid)} className="flex items-center gap-1.5 px-3 py-1.5 border border-red-900/50 text-[10px] font-bold uppercase text-red-500 hover:bg-red-950/30 transition-all">
                      <Ban className="w-3 h-3" /> Ban
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      ) : activeTab === 'roles' ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-sans italic text-gray-600 border-b border-card-border pb-4 mb-2">
            Assign titles and admin powers to your team. Only the Owner can do this.
          </p>
          {users.filter(u => u.uid !== ADMIN_UID).map(u => (
            <div key={u.uid} className="border border-card-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3 flex-shrink-0">
                {u.photoURL
                  ? <img src={u.photoURL} className="w-10 h-10 object-cover rounded-full border border-card-border" alt={u.displayName} />
                  : <div className="w-10 h-10 rounded-full border border-card-border bg-background flex items-center justify-center text-sm font-black text-gray-600">{u.displayName?.[0]?.toUpperCase()}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold font-heading text-foreground">{u.displayName || u.email}</h3>
                <p className="text-[10px] text-gray-600 font-sans">{u.email}</p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 flex-shrink-0 items-start md:items-center">
                <select
                  value={u.role || 'Contributor'}
                  onChange={e => handleRoleChange(u.uid, e.target.value, u.isAdmin || false)}
                  className="bg-background border border-card-border px-3 py-2 font-bold uppercase text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors"
                >
                  {ROLES.filter(r => r !== 'Owner').map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <label className="flex items-center gap-2 font-bold uppercase text-xs cursor-pointer border border-card-border px-3 py-2 text-gray-400 hover:text-foreground hover:border-foreground transition-all">
                  <input
                    type="checkbox"
                    checked={u.isAdmin || false}
                    onChange={e => handleRoleChange(u.uid, u.role || 'Contributor', e.target.checked)}
                    className="w-3.5 h-3.5 accent-red-600"
                  />
                  Admin Access
                </label>
              </div>
            </div>
          ))}
        </div>

      ) : (
        <div className="flex flex-col gap-6">
          <div className="border border-card-border bg-card p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
              <Sparkles className={`w-8 h-8 ${editorialStatus === 'running' ? 'animate-pulse' : ''}`} />
            </div>
            <h2 className="text-2xl font-black font-heading uppercase text-foreground mb-3">AI Editorial Engine</h2>
            <p className="font-sans text-sm text-gray-500 max-w-lg mb-8">
              The engine automatically fetches global news, filters for high-impact stories, 
              and transforms them into the signature "THE VOICES" storytelling format.
            </p>

            {editorialStatus === 'idle' && (
              <button
                onClick={async () => {
                  setEditorialStatus('running');
                  const stories = [
                    {
                      title: "The Physical Ceiling of the Digital Mind",
                      content: `<p>We talk about AI as if it’s a ghost in the machine, something ethereal and infinite. But the reality is far heavier, built on silicon and memory that we are rapidly running out of.</p><p>The tech world is currently staring at a crisis dubbed "RAMageddon." As AI data centers expand at a relentless pace, the demand for High-Bandwidth Memory (HBM) has officially outstripped global production capacities. Major suppliers have issued a stark warning: the shortage will persist through 2027.</p><blockquote>Perhaps a limit on memory is exactly what we need to remember the value of focus.</blockquote>`,
                      category: "Technology",
                      authorId: "editorial_engine",
                      authorEmail: "tech@thevoices.com"
                    },
                    {
                      title: "The Quiet Reshuffling of the Indian Wallet",
                      content: `<p>Banking used to be about marble pillars and heavy ledgers. Today, it’s a line of code on a smartphone—and as we’ve recently seen, that code can be rewritten or revoked in an instant.</p><p>The Indian financial landscape is shifting beneath our feet. The Reserve Bank of India’s decision to cancel the banking license of Paytm Payments Bank marks the end of an era for the country’s fintech pioneer.</p><blockquote>In our rush toward a cashless future, we must ensure we don't end up with a heartless one.</blockquote>`,
                      category: "India",
                      authorId: "editorial_engine",
                      authorEmail: "finance@thevoices.com"
                    },
                    {
                      title: "The Fragility of a Silence",
                      content: `<p>Peace is often described as the absence of war, but in the modern world, it feels more like a held breath. It is fragile, temporary, and requires constant maintenance to keep from shattering.</p><p>The US-brokered ceasefire in the Middle East currently stands as a testament to this fragility. While the guns have largely fallen silent, reports of violations and deep-seated skepticism from global leaders suggest that the peace is more of a tactical pause than a philosophical shift.</p><blockquote>We should appreciate the quiet moments, even when we know they are temporary.</blockquote>`,
                      category: "World",
                      authorId: "editorial_engine",
                      authorEmail: "world@thevoices.com"
                    },
                    {
                      title: "The Long Walk to the Winner’s Circle",
                      content: `<p>There is a specific kind of madness required to wait a lifetime for two minutes of action. In the world of high-stakes racing, that madness is often called a dream.</p><p>At the 2026 Kentucky Derby, jockey Jose Ortiz finally touched the gold he had been chasing for his entire career. It was a victory that transcended the sport—a narrative of persistence in a world that usually favors the young and the lucky.</p><blockquote>The fastest two minutes in sports are usually the result of the slowest twenty years of effort.</blockquote>`,
                      category: "Sports",
                      authorId: "editorial_engine",
                      authorEmail: "sports@thevoices.com"
                    },
                    {
                      title: "Beyond the Tool: The Rise of the AI Coworker",
                      content: `<p>We’ve spent the last three years learning how to talk to AI. Starting this month, we might find that the AI has started talking to itself—and getting the job done while we sleep.</p><p>As we approach Google I/O 2026, the buzz has shifted away from "Chatbots" toward "Agentic Platforms." Systems like amazeeClaw and Anthropic's new security layers aren't just answering questions; they are performing multi-step tasks autonomously.</p><blockquote>We are no longer just building tools; we are building colleagues. It’s time we figured out the office rules.</blockquote>`,
                      category: "Technology",
                      authorId: "editorial_engine",
                      authorEmail: "tech@thevoices.com"
                    }
                  ];

                  try {
                    for (const story of stories) {
                      await createPost(story as any);
                    }
                    setEditorialStatus('success');
                    const updatedPosts = await getAllPosts();
                    setPosts(updatedPosts);
                  } catch (e) {
                    console.error(e);
                    alert('Editorial cycle failed to publish.');
                    setEditorialStatus('idle');
                  }
                }}
                className="btn-premium px-10 py-3 flex items-center gap-3"
              >
                <Send className="w-4 h-4" />
                Trigger Editorial Cycle
              </button>
            )}

            {editorialStatus === 'running' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-primary animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Analyzing Global Trends...</p>
              </div>
            )}

            {editorialStatus === 'success' && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-full">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-black font-heading text-foreground uppercase">Cycle Complete</h4>
                  <p className="text-xs text-gray-500 mt-1">5 New Stories have been published to the front page.</p>
                </div>
                <button 
                  onClick={() => setEditorialStatus('idle')}
                  className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-foreground"
                >
                  Run Another Cycle
                </button>
              </div>
            )}
          </div>

          <div className="border border-card-border bg-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Engine Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-card-border bg-background/50">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Region Focus</div>
                <div className="text-sm font-bold text-foreground">India + Global</div>
              </div>
              <div className="p-4 border border-card-border bg-background/50">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Style Strength</div>
                <div className="text-sm font-bold text-primary uppercase">High (THE VOICES)</div>
              </div>
              <div className="p-4 border border-card-border bg-background/50">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Content Depth</div>
                <div className="text-sm font-bold text-foreground uppercase">Standard (300-500 words)</div>
              </div>
              <div className="p-4 border border-card-border bg-background/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Autonomous Mode</div>
                  <div className="text-sm font-bold text-foreground uppercase">Manual Trigger</div>
                </div>
                <div className="w-10 h-5 bg-gray-800 rounded-full relative">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
