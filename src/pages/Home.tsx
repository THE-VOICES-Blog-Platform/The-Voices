import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts, getUserProfile, type BlogPost, type UserProfile } from '../lib/db';
import GoogleAd from '../components/ads/GoogleAd';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface PostWithAuthor extends BlogPost {
  authorProfile?: UserProfile;
}

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  india: 'bg-[#FF9933] text-black',
  politics: 'bg-red-600 text-white',
  technology: 'bg-blue-600 text-white',
  business: 'bg-emerald-600 text-white',
  sports: 'bg-orange-500 text-white',
  health: 'bg-green-600 text-white',
  science: 'bg-purple-600 text-white',
  arts: 'bg-pink-500 text-white',
  world: 'bg-gray-700 text-white',
};

const CategoryTag = ({ category }: { category?: string }) => {
  if (!category) return null;
  const key = category.toLowerCase();
  const color = CATEGORY_COLORS[key] || 'bg-gray-700 text-white';
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${color}`}>
      {key === 'india' ? '🇮🇳 ' : ''}{category}
    </span>
  );
};

const Home = () => {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getAllPosts();
        const postsWithAuthors = await Promise.all(
          fetchedPosts.map(async (post) => {
            const authorProfile = await getUserProfile(post.authorId).catch(() => undefined);
            return { ...post, authorProfile: authorProfile || undefined };
          })
        );
        setPosts(postsWithAuthors);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-24 text-center">
        <div className="inline-block text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">
          ● Retrieving today's edition...
        </div>
      </div>
    );
  }

  const frontPagePost = posts.length > 0 ? posts[0] : null;
  const sidebarPosts = posts.slice(1, 4);
  const trendingPosts = posts.slice(0, 5);
  const bottomPosts = posts.slice(4);

  const getAuthorName = (post: PostWithAuthor) =>
    post.authorProfile?.displayName || post.authorEmail.split('@')[0];

  return (
    <div className="flex flex-col gap-0">
      <GoogleAd slot="1234567890" style={{ display: 'block', width: '100%', height: '90px' }} />

      {/* ── HERO EDITORIAL BANNER ─────────────────────────────────────── */}
      <div className="w-full border-b border-card-border py-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3">
          ● India's Independent Voice
        </p>
        <h2 className="text-4xl md:text-6xl font-black font-heading text-foreground leading-tight tracking-tight mb-3">
          Voices, Ideas, Stories.
        </h2>
        <p className="text-sm md:text-base font-sans text-gray-400 max-w-xl mx-auto leading-relaxed">
          While the world scrolls noise, we decode what actually matters.
        </p>
      </div>

      {/* ── FRONT PAGE ────────────────────────────────────────────────── */}
      {frontPagePost ? (
        <div className="flex flex-col md:flex-row gap-0 pb-10 border-b border-card-border mb-10">
          {/* Main Story */}
          <div className="w-full md:w-2/3 md:pr-8 md:border-r border-card-border flex flex-col">
            <div className="mb-4">
              <CategoryTag category={frontPagePost.category} />
              {(frontPagePost.viewsCount ?? 0) > 10 && (
                <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold text-orange-400 uppercase tracking-widest">
                  <TrendingUp className="w-3 h-3" /> Trending
                </span>
              )}
            </div>

            {frontPagePost.coverImageURL && (
              <div className="relative overflow-hidden mb-5 group">
                <img
                  src={frontPagePost.coverImageURL}
                  alt={frontPagePost.title}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              </div>
            )}

            <Link to={`/post/${frontPagePost.id}`} className="group">
              <h2 className="text-4xl md:text-6xl font-black font-heading leading-[1] mb-4 text-foreground group-hover:text-primary transition-colors duration-200">
                {frontPagePost.title}
              </h2>
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-widest mb-6 text-gray-500 border-y border-card-border py-2">
              <Link to={`/profile/${frontPagePost.authorId}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                {frontPagePost.authorProfile?.photoURL && (
                  <img src={frontPagePost.authorProfile.photoURL} alt="" className="w-5 h-5 object-cover rounded-full" />
                )}
                By {getAuthorName(frontPagePost)}
              </Link>
              <span className="text-gray-700">•</span>
              <span>{new Date(frontPagePost.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {frontPagePost.viewsCount ? <><span className="text-gray-700">•</span><span>{frontPagePost.viewsCount} views</span></> : null}
            </div>

            <div
              className="text-base leading-loose font-sans text-gray-400 line-clamp-5"
              dangerouslySetInnerHTML={{ __html: frontPagePost.content.substring(0, 600) + (frontPagePost.content.length > 600 ? '...' : '') }}
            />

            <Link
              to={`/post/${frontPagePost.id}`}
              className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary border-b border-primary pb-0.5 hover:gap-3 transition-all self-start"
            >
              Read Full Story <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-1/3 md:pl-8 flex flex-col gap-0 mt-8 md:mt-0">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-card-border pb-2 mb-5">
              ● Other Top Stories
            </h3>
            {sidebarPosts.map((post, index) => (
              <div
                key={post.id}
                className={`flex flex-col pb-5 ${index !== sidebarPosts.length - 1 ? 'border-b border-card-border mb-5' : ''}`}
              >
                <div className="flex gap-2 items-center mb-2">
                  <CategoryTag category={post.category} />
                </div>
                {post.coverImageURL && (
                  <div className="relative overflow-hidden mb-3 group">
                    <img src={post.coverImageURL} alt={post.title} className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  </div>
                )}
                <Link to={`/post/${post.id}`} className="group">
                  <h4 className="text-xl font-bold font-heading leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>
                </Link>
                <Link to={`/profile/${post.authorId}`} className="text-[10px] font-semibold uppercase text-gray-500 hover:text-primary transition-colors mb-2">
                  By {getAuthorName(post)}
                </Link>
                <div className="text-sm font-sans text-gray-500 line-clamp-2" dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
            ))}

            <GoogleAd slot="0987654321" format="rectangle" style={{ display: 'block', marginTop: '1rem' }} />

            {/* Write for Us CTA */}
            <div className="border border-card-border p-5 mt-6 text-center bg-card">
              <div className="text-[9px] font-bold uppercase tracking-widest text-primary mb-2">Join The Press</div>
              <h4 className="font-black text-lg font-heading uppercase text-foreground mb-2">Write for Us</h4>
              <p className="font-sans italic text-xs text-gray-500 mb-4">Share your story with India and the world.</p>
              <Link to="/write" className="btn-premium px-5 py-2 text-[10px]">Start Writing</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center border border-card-border p-12 bg-card mb-10">
          <div className="text-primary text-xs uppercase tracking-widest mb-4 font-bold">● Press Room</div>
          <h2 className="text-4xl font-black font-heading mb-4 uppercase text-foreground">The Front Page is Blank</h2>
          <p className="font-sans text-gray-400 mb-6">The presses haven't run yet. Be the first to publish.</p>
          <Link to="/write" className="btn-premium px-8 py-3 text-sm">Start Writing</Link>
        </div>
      )}

      {/* ── TRENDING SECTION ──────────────────────────────────────────── */}
      {trendingPosts.length > 0 && (
        <div className="w-full mb-10 border border-card-border bg-card">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-card-border">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Trending Now</span>
          </div>
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-card-border">
            {trendingPosts.slice(0, 4).map((post, i) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="flex-1 p-4 flex gap-3 items-start group hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl font-black font-heading text-gray-700 leading-none mt-0.5">0{i + 1}</span>
                <div>
                  <CategoryTag category={post.category} />
                  <h5 className="text-sm font-bold font-heading text-foreground mt-1 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h5>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── MORE FROM THE ARCHIVE ─────────────────────────────────────── */}
      {bottomPosts.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">More Stories</span>
            <div className="flex-1 h-px bg-card-border" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-card-border border border-card-border">
            {bottomPosts.map((post) => (
              <div
                key={post.id}
                className="bg-background p-5 flex flex-col group hover:bg-card transition-colors duration-200"
              >
                {post.coverImageURL && (
                  <div className="overflow-hidden mb-4">
                    <img
                      src={post.coverImageURL}
                      alt={post.title}
                      className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <div className="mb-2">
                  <CategoryTag category={post.category} />
                </div>
                <Link to={`/post/${post.id}`} className="flex-1">
                  <h3 className="text-xl font-bold font-heading text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <div
                    className="text-sm font-sans text-gray-500 line-clamp-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </Link>
                <div className="mt-4 pt-3 border-t border-card-border flex justify-between items-center text-[10px] uppercase font-semibold text-gray-600">
                  <Link to={`/profile/${post.authorId}`} className="hover:text-primary transition-colors">{getAuthorName(post)}</Link>
                  <span>{new Date(post.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER CTA ────────────────────────────────────────────────── */}
      <div className="mt-16 border-t border-card-border pt-10 pb-6 text-center">
        <p className="text-xs font-sans text-gray-600 italic">
          "Not everything that matters trends. That's why we exist."
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mt-3">
          © {new Date().getFullYear()} The Voices. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Home;
