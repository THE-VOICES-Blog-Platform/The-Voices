import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts, getUserProfile, type BlogPost, type UserProfile } from '../lib/db';
import GoogleAd from '../components/ads/GoogleAd';

interface PostWithAuthor extends BlogPost {
  authorProfile?: UserProfile;
}

const Home = () => {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getAllPosts();
        // Fetch author profiles for top posts
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
      <div className="w-full py-20 text-center font-bold text-2xl uppercase tracking-widest font-heading">
        Stop the presses... (Loading)
      </div>
    );
  }

  const frontPagePost = posts.length > 0 ? posts[0] : null;
  const sidebarPosts = posts.slice(1, 4);
  const bottomPosts = posts.slice(4);

  const getAuthorName = (post: PostWithAuthor) =>
    post.authorProfile?.displayName || post.authorEmail.split('@')[0];

  return (
    <div className="flex flex-col">
      <GoogleAd slot="1234567890" style={{ display: 'block', width: '100%', height: '90px' }} />

      {/* Front Page Headline Section */}
      {frontPagePost ? (
        <div className="flex flex-col md:flex-row gap-8 pb-8 border-b-4 border-black mb-8">
          {/* Main Story */}
          <div className="w-full md:w-2/3 md:pr-8 md:border-r-2 border-black flex flex-col">
            <div className="mb-4 text-center">
              <span className="uppercase font-bold text-xs tracking-widest border-y border-black py-1 px-4 mb-4 inline-block">
                {frontPagePost.category || 'Breaking News'}
              </span>
            </div>

            {frontPagePost.coverImageURL && (
              <img src={frontPagePost.coverImageURL} alt={frontPagePost.title} className="w-full h-52 object-cover border-2 border-black mb-4" />
            )}

            <Link to={`/post/${frontPagePost.id}`} className="group hover:opacity-80 transition-opacity">
              <h1 className="text-5xl md:text-7xl font-black font-heading leading-[0.9] mb-4 text-center group-hover:underline decoration-4 underline-offset-8">
                {frontPagePost.title}
              </h1>
            </Link>

            <div className="flex justify-center items-center gap-4 text-sm font-bold uppercase mb-6 border-b border-black pb-4 text-gray-700">
              <Link to={`/profile/${frontPagePost.authorId}`} className="hover:underline flex items-center gap-2">
                {frontPagePost.authorProfile?.photoURL && (
                  <img src={frontPagePost.authorProfile.photoURL} alt="" className="w-6 h-6 border border-black object-cover rounded-full" />
                )}
                By {getAuthorName(frontPagePost)}
                {frontPagePost.authorProfile?.role && (
                  <span className="text-xs px-1 border border-black">{frontPagePost.authorProfile.role}</span>
                )}
              </Link>
              <span>•</span>
              <span>{new Date(frontPagePost.createdAt.toMillis()).toLocaleDateString()}</span>
            </div>

            <div
              className="text-lg leading-relaxed font-serif text-justify line-clamp-6"
              dangerouslySetInnerHTML={{ __html: frontPagePost.content.substring(0, 800) + (frontPagePost.content.length > 800 ? '...' : '') }}
            />

            <Link to={`/post/${frontPagePost.id}`} className="mt-6 btn-outline px-6 py-3 text-xs self-center">
              Read Full Story &rarr;
            </Link>
          </div>

          {/* Sidebar Stories */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <h3 className="font-black uppercase text-xl border-y-2 border-black py-1 text-center bg-black text-[#f4f1ea]">Other Top Stories</h3>
            {sidebarPosts.map((post, index) => (
              <div key={post.id} className={`flex flex-col pb-6 ${index !== sidebarPosts.length - 1 ? 'border-b border-black/50' : ''}`}>
                {post.coverImageURL && (
                  <img src={post.coverImageURL} alt={post.title} className="w-full h-28 object-cover border border-black mb-2" />
                )}
                <Link to={`/post/${post.id}`} className="hover:underline decoration-2 underline-offset-4">
                  <h4 className="text-2xl font-bold font-heading leading-tight mb-2">{post.title}</h4>
                </Link>
                <Link to={`/profile/${post.authorId}`} className="text-xs font-bold uppercase mb-2 text-gray-600 hover:underline">
                  By {getAuthorName(post)}
                </Link>
                <div className="text-sm font-serif line-clamp-3 text-justify" dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
            ))}

            <GoogleAd slot="0987654321" format="rectangle" style={{ display: 'block' }} />

            <div className="border-4 border-black p-4 text-center">
              <h4 className="font-black text-2xl uppercase tracking-widest mb-2">Write for Us</h4>
              <p className="font-serif italic text-sm mb-3">Join The Voices. Share your story with the world.</p>
              <Link to="/write" className="btn-premium px-6 py-2 text-xs mt-2">Start Writing</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center border-4 border-black p-12">
          <h2 className="text-4xl font-black font-heading mb-4 uppercase">Front Page is Empty</h2>
          <p className="font-serif text-xl">The printing presses haven't run yet. Be the first to publish a story.</p>
          <Link to="/write" className="mt-6 btn-premium px-8 py-4 text-sm">Start Writing</Link>
        </div>
      )}

      {/* Grid of older posts */}
      {bottomPosts.length > 0 && (
        <div className="w-full">
          <h2 className="text-3xl font-black font-heading uppercase border-b-2 border-black pb-2 mb-6 text-center">More from the Archives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bottomPosts.map((post) => (
              <div key={post.id} className="border border-black p-4 flex flex-col h-full bg-[#f4f1ea]">
                {post.coverImageURL && (
                  <img src={post.coverImageURL} alt={post.title} className="w-full h-32 object-cover border border-black mb-3" />
                )}
                <Link to={`/post/${post.id}`} className="hover:underline decoration-2 underline-offset-4 flex-1">
                  <h3 className="text-2xl font-bold font-heading leading-tight mb-3">{post.title}</h3>
                  <div className="text-sm font-serif line-clamp-4 text-justify" dangerouslySetInnerHTML={{ __html: post.content }} />
                </Link>
                <div className="mt-4 pt-4 border-t border-black/30 flex justify-between items-center text-xs uppercase font-bold text-gray-700">
                  <Link to={`/profile/${post.authorId}`} className="hover:underline">{getAuthorName(post)}</Link>
                  <span>{new Date(post.createdAt.toMillis()).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
