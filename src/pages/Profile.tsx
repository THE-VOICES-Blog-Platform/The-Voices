import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile, getPostsByAuthor, followUser, unfollowUser, type UserProfile, type BlogPost } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_UID } from '../lib/moderation';
import { UserCircle, Users, FileText, UserPlus, UserCheck } from 'lucide-react';

const Profile = () => {
  const { uid } = useParams<{ uid: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const fetchData = async () => {
      try {
        const [p, userPosts] = await Promise.all([getUserProfile(uid), getPostsByAuthor(uid)]);
        setProfile(p);
        setPosts(userPosts);
        if (user && p?.followers) {
          setIsFollowing(p.followers.includes(user.uid));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid, user]);

  const handleFollow = async () => {
    if (!user || !uid) return;
    if (isFollowing) {
      await unfollowUser(uid, user.uid);
      setProfile(prev => prev ? { ...prev, followers: prev.followers.filter(f => f !== user.uid) } : null);
    } else {
      await followUser(uid, user.uid);
      setProfile(prev => prev ? { ...prev, followers: [...prev.followers, user.uid] } : null);
    }
    setIsFollowing(!isFollowing);
  };

  if (loading) return <div className="py-20 text-center font-heading font-black text-2xl uppercase animate-pulse">Retrieving Correspondent File...</div>;
  if (!profile) return <div className="py-20 text-center font-heading font-black text-2xl uppercase">Correspondent Not Found</div>;

  const isOwner = user?.uid === uid;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="border-4 border-black p-8 bg-white mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="w-28 h-28 border-4 border-black object-cover" />
          ) : (
            <div className="w-28 h-28 border-4 border-black bg-gray-100 flex items-center justify-center">
              <UserCircle className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-4xl font-black font-heading uppercase">{profile.displayName}</h1>
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1 border-2 border-black bg-black text-[#f4f1ea]">
                  {profile.isAdmin && uid !== ADMIN_UID ? 'Admin' : (uid === ADMIN_UID ? 'Owner' : profile.role)}
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{profile.email}</p>
              {profile.bio && <p className="font-serif italic text-base text-gray-700 max-w-lg">{profile.bio}</p>}
            </div>

            {!isOwner && user && (
              <button
                onClick={handleFollow}
                className={`flex items-center gap-2 px-5 py-2 border-2 border-black font-black uppercase text-sm transition-all flex-shrink-0 ${isFollowing ? 'bg-black text-[#f4f1ea] shadow-none' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]'}`}
              >
                {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </button>
            )}

            {isOwner && (
              <Link to="/settings" className="flex items-center gap-2 px-5 py-2 border-2 border-black font-black uppercase text-sm hover:bg-black hover:text-[#f4f1ea] transition-colors flex-shrink-0">
                Edit Profile
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5 pt-4 border-t border-black">
            <div className="text-center">
              <div className="text-2xl font-black font-heading">{profile.followers.length}</div>
              <div className="text-xs uppercase font-bold tracking-widest text-gray-600 flex items-center gap-1"><Users className="w-3 h-3" /> Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black font-heading">{posts.length}</div>
              <div className="text-xs uppercase font-bold tracking-widest text-gray-600 flex items-center gap-1"><FileText className="w-3 h-3" /> Articles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <h2 className="text-2xl font-black font-heading uppercase border-b-2 border-black pb-2 mb-6">
        Articles by {profile.displayName}
      </h2>
      {posts.length === 0 ? (
        <div className="border-2 border-black p-10 text-center bg-white">
          <p className="font-serif italic text-gray-600">No articles published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(post => (
            <Link key={post.id} to={`/post/${post.id}`} className="border-2 border-black bg-white p-5 flex flex-col gap-3 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
              {post.coverImageURL && (
                <img src={post.coverImageURL} alt={post.title} className="w-full h-40 object-cover border border-black" />
              )}
              <h3 className="text-xl font-black font-heading leading-tight group-hover:underline decoration-2 underline-offset-4">{post.title}</h3>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-600 mt-auto">
                {new Date(post.createdAt.toMillis()).toLocaleDateString()} · {post.likesCount} Likes
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
