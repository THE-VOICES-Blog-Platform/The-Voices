import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Heading2, List, ListOrdered, Quote, Code, ArrowLeft, Send, ImagePlus, X, Save } from 'lucide-react';
import { createPost, updatePost, getPostById, isUserBanned, recordViolation, CATEGORIES } from '../lib/db';
import { uploadArticleImage } from '../lib/storage';
import { moderateContent } from '../lib/moderation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-2 p-2 border-b-2 border-black bg-white mb-4">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 border border-black ${editor.isActive('bold') ? 'bg-black text-[#f4f1ea]' : 'hover:bg-gray-200'}`}><Bold className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 border border-black ${editor.isActive('italic') ? 'bg-black text-[#f4f1ea]' : 'hover:bg-gray-200'}`}><Italic className="w-4 h-4" /></button>
      <div className="w-px h-6 bg-black my-auto mx-2" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 border border-black ${editor.isActive('heading', { level: 2 }) ? 'bg-black text-[#f4f1ea]' : 'hover:bg-gray-200'}`}><Heading2 className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 border border-black ${editor.isActive('bulletList') ? 'bg-black text-[#f4f1ea]' : 'hover:bg-gray-200'}`}><List className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 border border-black ${editor.isActive('orderedList') ? 'bg-black text-[#f4f1ea]' : 'hover:bg-gray-200'}`}><ListOrdered className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 border border-black ${editor.isActive('blockquote') ? 'bg-black text-[#f4f1ea]' : 'hover:bg-gray-200'}`}><Quote className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 border border-black ${editor.isActive('codeBlock') ? 'bg-black text-[#f4f1ea]' : 'hover:bg-gray-200'}`}><Code className="w-4 h-4" /></button>
    </div>
  );
};

const Write = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(!!id);
  const [moderationError, setModerationError] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [existingCoverURL, setExistingCoverURL] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Begin your draft here...' })],
    content: '',
    editorProps: { attributes: { class: 'prose-news' } },
  });

  useEffect(() => {
    if (!id || !editor) return;
    const loadPost = async () => {
      try {
        const post = await getPostById(id);
        if (post) {
          if (post.authorId !== user?.uid) {
            alert("Permission denied. You can only edit your own stories.");
            navigate('/dashboard');
            return;
          }
          setTitle(post.title);
          setCategory(post.category || CATEGORIES[0]);
          setExistingCoverURL(post.coverImageURL || '');
          setCoverPreview(post.coverImageURL || '');
          editor.commands.setContent(post.content);
        }
      } catch (e) {
        console.error("Error loading post for edit:", e);
      } finally {
        setIsLoadingPost(false);
      }
    };
    loadPost();
  }, [id, editor, user, navigate]);

  if (!user) return <Navigate to="/auth" />;
  if (isLoadingPost) return <div className="py-20 text-center font-heading font-black text-2xl uppercase animate-pulse">Recalling from Archives...</div>;

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async (asDraft: boolean) => {
    if (!title.trim() || !editor?.getHTML() || !user) return;
    setModerationError('');
    setIsPublishing(true);
    try {
      const banned = await isUserBanned(user.uid);
      if (banned) {
        setModerationError('Your account has been suspended. You cannot publish new content.');
        setIsPublishing(false);
        return;
      }

      const contentHTML = editor.getHTML();
      const titleCheck = moderateContent(title);
      const bodyCheck = moderateContent(contentHTML);

      if (!titleCheck.isClean || !bodyCheck.isClean) {
        const result = await recordViolation(user.uid, user.email || 'unknown');
        setModerationError(result.banned
          ? 'Your account has been automatically suspended due to repeated violations.'
          : `${bodyCheck.warningMessage || titleCheck.warningMessage} (Strike ${result.violationCount}/3)`);
        setIsPublishing(false);
        return;
      }

      let coverImageURL = existingCoverURL;
      if (coverFile) {
        coverImageURL = await uploadArticleImage(coverFile);
      } else if (coverPreview === '') {
        coverImageURL = ''; // User removed the image
      }

      if (id) {
        // Update existing post
        await updatePost(id, {
          title,
          content: contentHTML,
          category,
          coverImageURL,
          isDraft: asDraft
        });
      } else {
        // Create new post
        await createPost({
          title,
          content: contentHTML,
          category,
          coverImageURL,
          authorId: user.uid,
          authorEmail: user.email || 'Unknown',
          isDraft: asDraft
        });
      }
      navigate('/dashboard');
    } catch (err) {
      console.error("Failed to publish post:", err);
      alert("Failed to submit to publisher.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[70vh]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 border-black pb-4 mb-8">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <button onClick={() => navigate(-1)} className="p-2 border-2 border-black hover:bg-black hover:text-[#f4f1ea] transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-3xl font-black font-heading uppercase">{id ? 'Editing Desk' : 'Drafting Desk'}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(true)}
            disabled={isPublishing || !title.trim()}
            className="px-6 py-3 border-4 border-black bg-white text-black font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black hover:text-[#f4f1ea] transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? 'Saving...' : <><Save className="w-5 h-5" /> Save Draft</>}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isPublishing || !title.trim()}
            className="px-6 py-3 border-4 border-black bg-black text-[#f4f1ea] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? 'Publishing...' : <><Send className="w-5 h-5" /> Publish</>}
          </button>
        </div>
      </div>

      {moderationError && (
        <div className="border-4 border-black bg-black text-[#f4f1ea] p-4 mb-6 font-bold uppercase text-sm tracking-wider text-center">
          ⚠ {moderationError}
        </div>
      )}

      {/* Cover Image Upload */}
      <div className="mb-6">
        {coverPreview ? (
          <div className="relative">
            <img src={coverPreview} alt="Cover" className="w-full h-64 object-cover border-2 border-black" />
            <button
              onClick={() => { setCoverFile(null); setCoverPreview(''); }}
              className="absolute top-2 right-2 p-1 bg-black text-white border border-white hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-black bg-white cursor-pointer hover:bg-gray-50 transition-colors gap-2">
            <ImagePlus className="w-8 h-8 text-gray-400" />
            <span className="font-bold uppercase text-xs tracking-widest text-gray-500">Add/Update Cover Photo (optional)</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
        )}
      </div>

      <div className="border-2 border-black p-8 bg-white flex-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-6 flex items-center gap-4">
          <label className="text-xs font-black uppercase tracking-widest border-b border-black pb-1">Section:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-2 border-black px-4 py-2 font-bold uppercase text-xs bg-white focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="ENTER HEADLINE"
          className="w-full text-5xl md:text-6xl font-black font-heading uppercase leading-none bg-transparent border-b-4 border-black focus:outline-none text-black pb-4 mb-8 placeholder:text-gray-400"
        />
        <div className="relative font-serif">
          <MenuBar editor={editor} />
          <EditorContent editor={editor} className="text-gray-900" />
        </div>
      </div>
    </div>
  );
};

export default Write;
