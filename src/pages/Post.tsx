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

  if (loading) return <div className="py-24 text-center text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">● Retrieving from archives...</div>;
  if (!post) return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-black font-heading uppercase mb-4 text-foreground">Article Not Found</h1>
      <Link to="/" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">Return to Front Page</Link>
    </div>
  );

  const isOwnPost = user?.uid === post.authorId;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[70vh]">
      <div className="flex justify-between items-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors border border-card-border px-4 py-2">
          <ArrowLeft className="w-3 h-3" /> Back to News
        </Link>
        {isOwnPost && (
          <Link to={`/edit/${id}`} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors border border-card-border px-4 py-2">
            <PenSquare className="w-3 h-3" /> Edit Story
          </Link>
        )}
      </div>

      <article className="border-b border-card-border pb-10 mb-10">
        {/* Category tag */}
        {post.category && (
          <div className="mb-4">
            <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-primary text-foreground">
              {post.category}
            </span>
          </div>
        )}

        {post.coverImageURL && (
          <div className="overflow-hidden mb-8">
            <img src={post.coverImageURL} alt={post.title} className="w-full h-80 object-cover" />
          </div>
        )}

        <h1 className="text-4xl md:text-6xl font-black font-heading leading-[1.05] mb-6 text-foreground">
          {post.title}
        </h1>

        <div className="flex flex-wrap justify-between items-center border-y border-card-border py-3 mb-8 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          <Link to={`/profile/${post.authorId}`} className="hover:text-primary transition-colors">
            By {author?.displayName || post.authorEmail.split('@')[0]}
            {author?.role && <span className="ml-2 text-[9px] px-1.5 py-0.5 border border-card-border text-gray-600">{author.role}</span>}
          </Link>
          <div className="flex gap-4">
            <span>{new Date(post.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>•</span>
            <span>{post.viewsCount || 0} Views</span>
          </div>
        </div>

        <div
          className="prose-news font-sans text-base leading-[1.9] text-gray-300"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* THE VOICES TAKE brand block */}
        <div className="mt-10 border-l-4 border-primary bg-card p-5">
          <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-primary" />
            The Voices Take
          </div>
          <p className="text-sm font-sans italic text-gray-400 leading-relaxed">
            This piece reflects a perspective worth hearing. Not everything that matters trends — that's why we amplify it.
          </p>
        </div>

        <GoogleAd slot="5678901234" style={{ display: 'block', margin: '40px 0' }} />

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={`flex items-center gap-2 px-6 py-3 border text-sm font-bold uppercase tracking-widest transition-all ${
              hasLiked ? 'bg-primary border-primary text-foreground' : 'border-card-border text-gray-400 hover:border-primary hover:text-primary'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            {hasLiked ? 'Recommended' : 'Recommend'} ({post.likesCount})
          </button>

          {user && (
            <button
              onClick={handleSaveToggle}
              className={`flex items-center gap-2 px-6 py-3 border text-sm font-bold uppercase tracking-widest transition-all ${
                isSaved ? 'bg-primary border-primary text-foreground' : 'border-card-border text-gray-400 hover:border-primary hover:text-primary'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      </article>

      {/* ── Author Card ────────────────────────────────────────────────────── */}
      {author && (
        <div className="border border-card-border p-6 bg-card mb-10 flex flex-col md:flex-row gap-5 items-start">
          <Link to={`/profile/${author.uid}`} className="flex-shrink-0">
            {author.photoURL ? (
              <img src={author.photoURL} alt={author.displayName} className="w-16 h-16 object-cover rounded-full border border-card-border hover:opacity-80 transition-opacity" />
            ) : (
              <div className="w-16 h-16 border border-card-border bg-background rounded-full flex items-center justify-center">
                <UserCircle className="w-10 h-10 text-gray-600" />
              </div>
            )}
          </Link>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <Link to={`/profile/${author.uid}`} className="hover:text-primary transition-colors">
                  <h3 className="text-xl font-bold font-heading text-foreground">{author.displayName}</h3>
                </Link>
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-card-border text-gray-500 inline-block mt-1">
                  {author.uid === ADMIN_UID ? 'Owner' : author.role}
                </span>
              </div>
              {!isOwnPost && user && (
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-4 py-2 border text-xs font-bold uppercase tracking-widest transition-all ${
                    isFollowing ? 'bg-primary border-primary text-foreground' : 'border-card-border text-gray-400 hover:border-primary hover:text-primary'
                  }`}
                >
                  {isFollowing ? <><UserCheck className="w-3 h-3" /> Following</> : <><UserPlus className="w-3 h-3" /> Follow</>}
                </button>
              )}
            </div>
            {author.bio && <p className="font-sans italic text-sm text-gray-500 mt-2">{author.bio}</p>}
            <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-600">
              {author.followers.length} Followers
            </div>
          </div>
        </div>
      )}

      {/* ── Comments ──────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <h3 className="text-xl font-black font-heading uppercase border-b border-card-border pb-3 mb-6 text-foreground">
          Letters to the Editor
        </h3>
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8 border border-card-border p-4 bg-card">
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-500">Submit your thoughts</label>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="w-full bg-background border border-card-border p-3 font-sans text-sm text-foreground resize-none h-24 focus:outline-none focus:border-primary transition-colors mb-4 placeholder:text-gray-600"
              placeholder="Write your letter here..."
            />
            <button type="submit" disabled={!newComment.trim()} className="btn-premium px-6 py-2 text-xs flex items-center gap-2 disabled:opacity-40">
              <Send className="w-3 h-3" /> Send Letter
            </button>
          </form>
        ) : (
          <div className="mb-8 border border-card-border p-6 bg-card text-center">
            <p className="font-sans italic text-sm text-gray-500 mb-4">You must be signed in to submit a letter to the editor.</p>
            <Link to="/auth" className="btn-outline px-6 py-2 text-xs">Sign In</Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {comments.length === 0
            ? <p className="font-sans italic text-sm text-gray-600">No letters have been submitted for this article yet.</p>
            : comments.map((comment, i) => (
              <div key={comment.id || i} className="border border-card-border p-4 bg-card">
                <p className="font-sans text-sm text-gray-300 mb-3 leading-relaxed">"{comment.content}"</p>
                <div className="border-t border-card-border pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 text-right">
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
