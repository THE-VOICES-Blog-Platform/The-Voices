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
      <div className="w-full py-20 text-center font-bold text-2xl uppercase tracking-widest font-heading animate-pulse">
        Sifting through the morgue... (Loading {categoryName})
      </div>
    );
  }

  const getAuthorName = (post: PostWithAuthor) =>
    post.authorProfile?.displayName || post.authorEmail.split('@')[0];

  return (
    <div className="flex flex-col">
      <div className="border-b-4 border-black pb-4 mb-8">
        <h1 className="text-6xl md:text-8xl font-black font-heading uppercase text-center leading-none" style={{ transform: 'scaleY(1.1)' }}>
          {categoryName}
        </h1>
        <p className="text-center font-serif italic text-lg mt-2">Latest reports from the field</p>
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center border-4 border-black p-12 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-4xl font-black font-heading mb-4 uppercase">Quiet in the {categoryName} Section</h2>
          <p className="font-serif text-xl">No stories have broken in this department yet. Our correspondents are on the move.</p>
          <Link to="/write" className="mt-8 inline-block border-2 border-black px-8 py-3 uppercase font-bold hover:bg-black hover:text-[#f4f1ea] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
            File a Report
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post) => (
            <div key={post.id} className="border-2 border-black p-6 flex flex-col h-full bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all group">
              {post.coverImageURL && (
                <img src={post.coverImageURL} alt={post.title} className="w-full h-48 object-cover border-2 border-black mb-4" />
              )}
              <Link to={`/post/${post.id}`} className="group-hover:opacity-80 transition-opacity flex-1">
                <h3 className="text-3xl font-black font-heading leading-tight mb-4 group-hover:underline decoration-2 underline-offset-4 uppercase">
                  {post.title}
                </h3>
                <div className="text-base font-serif line-clamp-4 text-justify mb-4" dangerouslySetInnerHTML={{ __html: post.content }} />
              </Link>
              <div className="mt-auto pt-4 border-t border-black flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-700">
                <Link to={`/profile/${post.authorId}`} className="hover:underline flex items-center gap-2">
                  {post.authorProfile?.photoURL && (
                    <img src={post.authorProfile.photoURL} alt="" className="w-5 h-5 border border-black object-cover" />
                  )}
                  By {getAuthorName(post)}
                </Link>
                <span>{new Date(post.createdAt.toMillis()).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Category;
