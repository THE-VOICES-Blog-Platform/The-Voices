import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostsByCategory, getUserProfile, type BlogPost, type UserProfile } from '../lib/db';

interface PostWithAuthor extends BlogPost {
  authorProfile?: UserProfile;
}

const Category = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryName) return;
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Capitalize category name to match DB
        const formattedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        const fetchedPosts = await getPostsByCategory(formattedCategory);
        
        const postsWithAuthors = await Promise.all(
          fetchedPosts.map(async (post) => {
            const authorProfile = await getUserProfile(post.authorId).catch(() => undefined);
            return { ...post, authorProfile: authorProfile || undefined };
          })
        );
        setPosts(postsWithAuthors);
      } catch (error) {
        console.error("Failed to fetch posts by category:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [categoryName]);

  if (loading) {
    return (
      <div className="w-full py-24 text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">
          ● Loading {categoryName} section...
        </div>
      </div>
    );
  }

  const getAuthorName = (post: PostWithAuthor) =>
    post.authorProfile?.displayName || post.authorEmail.split('@')[0];

  const isIndia = categoryName?.toLowerCase() === 'india';

  return (
    <div className="flex flex-col">
      {/* Section Header */}
      <div className="border-b border-card-border pb-6 mb-10">
        {isIndia && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF9933] mb-3">🇮🇳 India Section</p>
        )}
        <h1 className="text-5xl md:text-7xl font-black font-heading uppercase text-foreground leading-none">
          {categoryName}
        </h1>
        <p className="font-sans text-sm text-gray-500 mt-2">Latest reports from the field</p>
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center border border-card-border p-12 bg-card">
          <div className="text-primary text-xs uppercase tracking-widest mb-4 font-bold">● No stories yet</div>
          <h2 className="text-3xl font-black font-heading mb-4 uppercase text-foreground">Quiet in the {categoryName} Section</h2>
          <p className="font-sans text-gray-400 mb-6">No stories have broken here yet. Be the first correspondent.</p>
          <Link to="/write" className="btn-premium px-8 py-3 text-xs">File a Report</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-card-border border border-card-border">
          {posts.map((post) => (
            <div key={post.id} className="bg-background p-5 flex flex-col group hover:bg-card transition-colors duration-200">
              {post.coverImageURL && (
                <div className="overflow-hidden mb-4">
                  <img src={post.coverImageURL} alt={post.title} className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
              )}
              <div className="mb-2">
                <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${isIndia ? 'bg-[#FF9933] text-black' : 'bg-primary text-foreground'}`}>
                  {isIndia ? '🇮🇳 ' : ''}{categoryName}
                </span>
              </div>
              <Link to={`/post/${post.id}`} className="flex-1">
                <h3 className="text-xl font-bold font-heading leading-snug mb-3 text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <div className="text-sm font-sans text-gray-500 line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
              </Link>
              <div className="mt-4 pt-3 border-t border-card-border flex justify-between items-center text-[10px] uppercase font-semibold text-gray-600">
                <Link to={`/profile/${post.authorId}`} className="hover:text-primary transition-colors flex items-center gap-2">
                  {post.authorProfile?.photoURL && (
                    <img src={post.authorProfile.photoURL} alt="" className="w-5 h-5 object-cover rounded-full" />
                  )}
                  By {getAuthorName(post)}
                </Link>
                <span>{new Date(post.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Category;
