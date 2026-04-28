import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Heading2, List, ListOrdered, Quote,
  Code, ArrowLeft, Send, ImagePlus, X, Save
} from 'lucide-react';
import { createPost, updatePost, getPostById, isUserBanned, recordViolation, CATEGORIES } from '../lib/db';
import { uploadArticleImage } from '../lib/storage';
import { moderateContent, ADMIN_UID } from '../lib/moderation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  const btn = (active: boolean) =>
    `p-2 border transition-all duration-150 ${active
      ? 'bg-primary border-primary text-foreground'
      : 'border-card-border text-gray-500 hover:text-foreground hover:border-gray-500'}`;
  return (
    <div className="flex flex-wrap gap-1.5 p-3 border-b border-card-border bg-card mb-4">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}><Bold className="w-3.5 h-3.5" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}><Italic className="w-3.5 h-3.5" /></button>
      <div className="w-px h-6 bg-card-border my-auto mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}><Heading2 className="w-3.5 h-3.5" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}><List className="w-3.5 h-3.5" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}><ListOrdered className="w-3.5 h-3.5" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))}><Quote className="w-3.5 h-3.5" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btn(editor.isActive('codeBlock'))}><Code className="w-3.5 h-3.5" /></button>
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
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Start writing your story...' })],
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
            alert('Permission denied.');
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
        console.error('Error loading post for edit:', e);
      } finally {
        setIsLoadingPost(false);
      }
    };
    loadPost();
  }, [id, editor, user, navigate]);

  if (!user) return <Navigate to="/auth" />;
  if (isLoadingPost) return (
    <div className="py-24 text-center text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">
      ● Recalling from Archives...
    </div>
  );

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
      if ((!titleCheck.isClean || !bodyCheck.isClean) && user.uid !== ADMIN_UID) {
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
        coverImageURL = '';
      }
      if (id) {
        await updatePost(id, { title, content: contentHTML, category, coverImageURL, isDraft: asDraft });
      } else {
        await createPost({ title, content: contentHTML, category, coverImageURL, authorId: user.uid, authorEmail: user.email || 'Unknown', isDraft: asDraft });
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to publish post:', err);
      alert('Failed to submit to publisher.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[80vh]">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-card-border pb-5 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border border-card-border text-gray-500 hover:text-foreground hover:border-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary mb-0.5">
              ● The Voices
            </div>
            <h1 className="text-2xl font-black font-heading uppercase text-foreground">
              {id ? 'Editing Desk' : 'Drafting Desk'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(true)}
            disabled={isPublishing || !title.trim()}
            className="flex items-center gap-2 px-5 py-2.5 border border-card-border text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-foreground hover:border-foreground transition-all disabled:opacity-30"
          >
            <Save className="w-3.5 h-3.5" />
            {isPublishing ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isPublishing || !title.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Moderation error */}
      {moderationError && (
        <div className="border-l-4 border-primary bg-red-950/30 px-5 py-4 mb-6 text-sm font-sans text-red-400">
          ⚠ {moderationError}
        </div>
      )}

      {/* Cover Image */}
      <div className="mb-6">
        {coverPreview ? (
          <div className="relative group">
            <img src={coverPreview} alt="Cover" className="w-full h-56 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => { setCoverFile(null); setCoverPreview(''); }}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-card-border text-xs font-bold uppercase text-gray-300"
              >
                <X className="w-3.5 h-3.5" /> Remove Cover
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-36 border border-dashed border-card-border bg-card cursor-pointer hover:border-gray-500 transition-colors gap-2">
            <ImagePlus className="w-6 h-6 text-gray-600" />
            <span className="font-sans text-xs text-gray-600 uppercase tracking-widest">Add Cover Photo (optional)</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
        )}
      </div>

      {/* Editor Card */}
      <div className="flex-1 border border-card-border bg-card">
        {/* Category + section meta */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-card-border">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Section:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-background border border-card-border px-3 py-1.5 text-xs font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="px-6 pt-6 pb-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="YOUR HEADLINE HERE"
            className="w-full text-3xl md:text-5xl font-black font-heading uppercase bg-transparent border-b border-card-border focus:outline-none focus:border-primary text-foreground pb-4 mb-2 placeholder:text-gray-700 transition-colors"
          />
        </div>

        {/* Rich text editor */}
        <div className="px-6 pb-6 font-sans">
          <MenuBar editor={editor} />
          <EditorContent editor={editor} className="text-gray-300 min-h-[300px]" />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="mt-4 text-center text-[10px] font-sans text-gray-700 uppercase tracking-widest">
        Your draft is not auto-saved — remember to save before leaving.
      </div>
    </div>
  );
};

export default Write;
