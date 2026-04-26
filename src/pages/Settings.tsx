import { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, ensureUserProfile, type UserProfile } from '../lib/db';
import { uploadProfilePicture } from '../lib/storage';
import { UserCircle, Save, ArrowLeft, Camera } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [previewURL, setPreviewURL] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const p = await ensureUserProfile(user.uid, user.email || '');
      setProfile(p);
      setDisplayName(p.displayName || '');
      setBio(p.bio || '');
      setRole(p.role || 'Contributor');
      setPhotoURL(p.photoURL || '');
    };
    load();
  }, [user]);

  if (!user) return <Navigate to="/auth" />;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
    setError('');
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      setError('Display name cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let finalPhotoURL = photoURL;
      if (selectedFile) {
        finalPhotoURL = await uploadProfilePicture(user.uid, selectedFile);
      }
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        role: role.trim(),
        photoURL: finalPhotoURL,
      });
      setPhotoURL(finalPhotoURL);
      setSelectedFile(null);
      setPreviewURL('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save profile:", e);
      setError('Failed to save. Check your Cloudinary preset is set to Unsigned.');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = previewURL || photoURL;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b-4 border-black pb-4 mb-8">
        <Link to="/dashboard" className="p-2 border-2 border-black hover:bg-black hover:text-[#f4f1ea] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-4xl font-black font-heading uppercase">Profile Settings</h1>
      </div>

      <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

        {/* Top section: Photo LEFT, fields RIGHT */}
        <div className="flex flex-col md:flex-row gap-0 border-b-2 border-black">
          
          {/* Left: Avatar */}
          <div className="flex flex-col items-center justify-center gap-4 p-8 border-b-2 md:border-b-0 md:border-r-2 border-black bg-gray-50 md:w-64 flex-shrink-0">
            <div className="relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-36 h-36 border-4 border-black object-cover"
                />
              ) : (
                <div className="w-36 h-36 border-4 border-black bg-gray-200 flex items-center justify-center">
                  <UserCircle className="w-20 h-20 text-gray-400" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-black text-[#f4f1ea] border-2 border-black hover:bg-gray-800 transition-colors"
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-black uppercase tracking-widest border-2 border-black px-4 py-2 hover:bg-black hover:text-[#f4f1ea] transition-colors w-full text-center"
            >
              Change Photo
            </button>
            {selectedFile && (
              <p className="text-xs text-center text-gray-500 font-mono">{selectedFile.name}</p>
            )}

            {/* Role badge */}
            {profile && (
              <div className="text-center mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-black inline-block">
                  {profile.role}
                </span>
              </div>
            )}
          </div>

          {/* Right: Fields */}
          <div className="flex-1 p-8 flex flex-col gap-6">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2 border-b border-black w-max pb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full border-2 border-black px-4 py-3 font-serif text-xl bg-transparent focus:outline-none focus:bg-gray-50 transition-colors"
                placeholder="Your name as shown on articles"
              />
            </div>

            {/* Role / Title */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2 border-b border-black w-max pb-1">
                Professional Title / Position
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full border-2 border-black px-4 py-3 font-serif text-xl bg-transparent focus:outline-none focus:bg-gray-50 transition-colors"
                placeholder="e.g. Senior Reporter, Political Analyst..."
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2 border-b border-black w-max pb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                className="w-full border-2 border-black px-4 py-3 font-serif text-base bg-transparent resize-none focus:outline-none focus:bg-gray-50 transition-colors"
                placeholder="Tell your readers who you are..."
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2 border-b border-black w-max pb-1">
                Email (cannot be changed)
              </label>
              <p className="font-mono text-sm text-gray-500 px-4 py-3 border border-gray-300 bg-gray-50">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-t-2 border-black px-8 py-4 bg-black text-[#f4f1ea] font-bold uppercase text-sm tracking-wider text-center">
            ⚠ {error}
          </div>
        )}

        {/* Bottom: Save & Links */}
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50">
          <Link
            to={`/profile/${user.uid}`}
            className="text-sm font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4 order-2 md:order-1"
          >
            View Public Profile →
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="order-1 md:order-2 px-10 py-4 border-4 border-black bg-black text-[#f4f1ea] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-60 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
