import { useEffect, useState } from 'react';
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostById, likePost, incrementPostViews, getCommentsByPost, addComment, getUserProfile, followUser, unfollowUser, ensureUserProfile, savePost, unsavePost, createNotification, type BlogPost, type Comment, type UserProfile } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ThumbsUp, Send, UserCircle, UserPlus, UserCheck, PenSquare, Bookmark, BookmarkCheck } from 'lucide-react';
import GoogleAd from '../components/ads/GoogleAd';
import { ADMIN_UID } from '../lib/moderation';

const Post = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      ensureUserProfile(user.uid, user.email || '').then(setCurrentUserProfile);
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const fetchedPost = await getPostById(id);
        setPost(fetchedPost);
        if (fetchedPost) {
          const [fetchedComments, authorProfile] = await Promise.all([
            getCommentsByPost(id),
            getUserProfile(fetchedPost.authorId)
          ]);
          setComments(fetchedComments);
          setAuthor(authorProfile);
          if (user && authorProfile?.followers) {
            setIsFollowing(authorProfile.followers.includes(user.uid));
          }
          // Increment views
          if (!sessionStorage.getItem(`viewed_${id}`)) {
            incrementPostViews(id);
            sessionStorage.setItem(`viewed_${id}`, 'true');
          }
        }
      } catch (error) {
        console.error("Error loading post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleLike = async () => {
    if (!id || hasLiked || !user) return;
    try {
      await likePost(id);
      setPost(prev => prev ? { ...prev, likesCount: prev.likesCount + 1 } : null);
      setHasLiked(true);
      if (post && post.authorId !== user.uid) {
        await createNotification({
          userId: post.authorId,
          type: 'like',
          title: 'New Recommendation',
          message: `${currentUserProfile?.displayName || 'Someone'} recommended your article "${post.title}".`,
          link: `/post/${id}`
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveToggle = async () => {
    if (!id || !user) return;
    try {
      if (isSaved) {
        await unsavePost(user.uid, id);
        setIsSaved(false);
      } else {
        await savePost(user.uid, id);
        setIsSaved(true);
      }
    } catch (e) { console.error(e); }
  };

  const handleFollow = async () => {
    if (!user || !author) return;
    if (isFollowing) {
      await unfollowUser(author.uid, user.uid);
      setAuthor(prev => prev ? { ...prev, followers: prev.followers.filter(f => f !== user.uid) } : null);
    } else {
      await followUser(author.uid, user.uid);
      setAuthor(prev => prev ? { ...prev, followers: [...prev.followers, user.uid] } : null);
      await createNotification({
        userId: author.uid,
        type: 'follow',
        title: 'New Follower',
        message: `${currentUserProfile?.displayName || 'Someone'} started following you.`,
        link: `/profile/${user.uid}`
      });
    }
    setIsFollowing(!isFollowing);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !newComment.trim()) return;
    try {
      const userProfile = await ensureUserProfile(user.uid, user.email || '');
      await addComment({ postId: id, authorId: user.uid, authorEmail: userProfile.displayName || user.email || 'Anonymous', content: newComment.trim() });
      setNewComment('');
      setComments(prev => [...prev, {
        postId: id,
        authorEmail: userProfile.displayName || user.email || 'Anonymous',
        content: newComment.trim(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdAt: { toMillis: () => Date.now() } as any
      }]);
      if (post && post.authorId !== user.uid) {
        await createNotification({
          userId: post.authorId,
          type: 'comment',
          title: 'New Letter',
          message: `${userProfile.displayName || 'Someone'} submitted a letter to your article "${post.title}".`,
          link: `/post/${id}`
        });
      }
    } catch (error) { console.error("Error submitting comment", error); }
  };

  useEffect(() => {
    if (currentUserProfile && id) {
      setIsSaved(currentUserProfile.savedPostIds?.includes(id) || false);
    }
  }, [currentUserProfile, id]);

  if (loading) return <div className="py-20 text-center font-heading font-black text-2xl uppercase">Retrieving from archives...</div>;
  if (!post) return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-black font-heading uppercase mb-4">Article Not Found</h1>
      <Link to="/" className="underline decoration-2 font-bold uppercase text-sm">Return to Front Page</Link>
    </div>
  );

  const isOwnPost = user?.uid === post.authorId;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[70vh]">
      <div className="flex justify-between items-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 border-2 border-black w-max px-4 py-1 font-bold uppercase text-xs hover:bg-black hover:text-[#f4f1ea] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>
        {isOwnPost && (
          <Link to={`/edit/${id}`} className="inline-flex items-center gap-2 border-2 border-black w-max px-4 py-1 font-bold uppercase text-xs hover:bg-black hover:text-[#f4f1ea] transition-colors">
            <PenSquare className="w-4 h-4" /> Edit Story
          </Link>
        )}
      </div>

      <article className="border-b-4 border-black pb-8 mb-8">
        {/* Cover Image */}
        {post.coverImageURL && (
          <img src={post.coverImageURL} alt={post.title} className="w-full h-72 object-cover border-2 border-black mb-8" />
        )}

        <h1 className="text-5xl md:text-7xl font-black font-heading uppercase leading-[0.9] mb-6 text-center border-b-2 border-black pb-6">
          {post.title}
        </h1>

        <div className="flex flex-col md:flex-row justify-between items-center border-b border-black pb-4 mb-8 text-sm font-bold uppercase tracking-widest text-gray-700">
          <Link to={`/profile/${post.authorId}`} className="hover:underline">
            By {author?.displayName || post.authorEmail.split('@')[0]}
            {author?.role && <span className="ml-2 text-xs px-2 py-0.5 border border-black">{author.role}</span>}
          </Link>
          <div className="flex gap-4">
            <span>{new Date(post.createdAt.toMillis()).toLocaleDateString()}</span>
            <span>•</span>
            <span>{post.viewsCount || 0} Views</span>
          </div>
        </div>

        <div
          className="prose-news font-serif text-lg leading-relaxed text-justify"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <GoogleAd slot="5678901234" style={{ display: 'block', margin: '40px 0' }} />

        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={`flex items-center gap-2 px-6 py-3 border-4 border-black font-black uppercase tracking-widest transition-all ${hasLiked ? 'bg-black text-[#f4f1ea] shadow-none translate-x-[4px] translate-y-[4px]' : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]'}`}
          >
            <ThumbsUp className="w-5 h-5" />
            {hasLiked ? 'Recommended' : 'Recommend Article'} ({post.likesCount})
          </button>
          
          {user && (
            <button
              onClick={handleSaveToggle}
              className={`flex items-center gap-2 px-6 py-3 border-4 border-black font-black uppercase tracking-widest transition-all ${isSaved ? 'bg-black text-[#f4f1ea] shadow-none translate-x-[4px] translate-y-[4px]' : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]'}`}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      </article>

      {/* ── Author Card ────────────────────────────────────────────────────── */}
      {author && (
        <div className="border-4 border-black p-6 bg-white mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-5 items-start">
          <Link to={`/profile/${author.uid}`} className="flex-shrink-0">
            {author.photoURL ? (
              <img src={author.photoURL} alt={author.displayName} className="w-20 h-20 border-2 border-black object-cover hover:opacity-80 transition-opacity" />
            ) : (
              <div className="w-20 h-20 border-2 border-black bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <UserCircle className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </Link>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <Link to={`/profile/${author.uid}`} className="hover:underline decoration-2">
                  <h3 className="text-2xl font-black font-heading uppercase">{author.displayName}</h3>
                </Link>
                <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 border border-black inline-block mt-1">
                  {author.uid === ADMIN_UID ? 'Owner' : author.role}
                </span>
              </div>
              {!isOwnPost && user && (
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-black uppercase text-xs transition-all ${isFollowing ? 'bg-black text-[#f4f1ea]' : 'bg-white hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]'}`}
                >
                  {isFollowing ? <><UserCheck className="w-3 h-3" /> Following</> : <><UserPlus className="w-3 h-3" /> Follow</>}
                </button>
              )}
            </div>
            {author.bio && <p className="font-serif italic text-sm text-gray-700 mt-2">{author.bio}</p>}
            <div className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-600">
              {author.followers.length} Followers
            </div>
          </div>
        </div>
      )}

      {/* ── Comments ──────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <h3 className="text-2xl font-black font-heading uppercase border-b-2 border-black pb-2 mb-6">Letters to the Editor</h3>
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8 border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <label className="block text-sm font-bold uppercase tracking-widest mb-2 border-b border-black w-max pb-1">Submit your thoughts</label>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="w-full bg-transparent border-2 border-black p-3 font-serif resize-none h-24 focus:outline-none focus:bg-gray-50 transition-colors mb-4"
              placeholder="Write your letter here..."
            />
            <button type="submit" disabled={!newComment.trim()} className="px-6 py-2 bg-black text-[#f4f1ea] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              <Send className="w-4 h-4" /> Send Letter
            </button>
          </form>
        ) : (
          <div className="mb-8 border-2 border-black p-6 bg-white text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-serif italic mb-4">You must be a subscriber to submit a letter to the editor.</p>
            <Link to="/auth" className="inline-block border-2 border-black px-6 py-2 uppercase font-bold hover:bg-black hover:text-[#f4f1ea]">Subscribe Now</Link>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {comments.length === 0
            ? <p className="font-serif italic text-gray-600">No letters have been submitted for this article yet.</p>
            : comments.map((comment, i) => (
              <div key={comment.id || i} className="border border-black p-4 bg-[#f4f1ea]">
                <p className="font-serif text-lg mb-3 leading-relaxed">"{comment.content}"</p>
                <div className="border-t border-black/30 pt-2 text-xs font-bold uppercase tracking-widest text-gray-600 text-right">
                  — {comment.authorEmail.split('@')[0]}
                </div>
              </div>
            ))
          }
        </div>
      </section>
    </div>
  );
};

export default Post;
