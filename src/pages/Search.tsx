import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAllPosts, getUserProfile, type BlogPost, type UserProfile } from '../lib/db';

interface PostWithAuthor extends BlogPost {
  authorProfile?: UserProfile;
}

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const allPosts = await getAllPosts();
        const filtered = allPosts.filter(post => 
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.category?.toLowerCase().includes(query.toLowerCase())
        );

        const postsWithAuthors = await Promise.all(
          filtered.map(async (post) => {
            const authorProfile = await getUserProfile(post.authorId).catch(() => undefined);
            return { ...post, authorProfile: authorProfile || undefined };
          })
        );
        setResults(postsWithAuthors);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <div className="flex flex-col">
      <div className="border-b-4 border-black pb-4 mb-8">
        <h1 className="text-4xl md:text-6xl font-black font-heading uppercase text-center leading-none">
          Search Archives
        </h1>
        <p className="text-center font-serif italic text-lg mt-2">
          {query ? `Results for: "${query}"` : "Enter a keyword to search our records"}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center font-bold text-2xl uppercase tracking-widest font-heading animate-pulse">
          Digging through the files...
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center border-4 border-black p-12 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-4xl font-black font-heading mb-4 uppercase">No Records Found</h2>
          <p className="font-serif text-xl">The keyword "{query}" yielded no matching reports in our current circulation.</p>
          <Link to="/" className="mt-8 inline-block border-2 border-black px-8 py-3 uppercase font-bold hover:bg-black hover:text-[#f4f1ea] transition-all">
            Return to Front Page
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {results.map((post) => (
            <div key={post.id} className="border-2 border-black p-6 flex flex-col h-full bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all group">
              {post.coverImageURL && (
                <img src={post.coverImageURL} alt={post.title} className="w-full h-48 object-cover border-2 border-black mb-4" />
              )}
              <Link to={`/post/${post.id}`} className="group-hover:opacity-80 transition-opacity flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest border border-black px-2 py-0.5 mb-2 inline-block">
                  {post.category || 'General'}
                </span>
                <h3 className="text-2xl font-black font-heading leading-tight mb-4 group-hover:underline decoration-2 underline-offset-4 uppercase">
                  {post.title}
                </h3>
                <div className="text-sm font-serif line-clamp-3 text-justify mb-4" dangerouslySetInnerHTML={{ __html: post.content }} />
              </Link>
              <div className="mt-auto pt-4 border-t border-black flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-700">
                <span>By {post.authorProfile?.displayName || post.authorEmail.split('@')[0]}</span>
                <span>{new Date(post.createdAt.toMillis()).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
