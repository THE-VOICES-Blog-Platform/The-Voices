import { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, ensureUserProfile, type UserProfile } from '../lib/db';
import { uploadProfilePicture } from '../lib/storage';
import { UserCircle, Save, ArrowLeft, Camera, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

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
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
    setError('');
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) { setError('Display name cannot be empty.'); return; }
    setSaving(true); setError('');
    try {
      let finalPhotoURL = photoURL;
      if (selectedFile) finalPhotoURL = await uploadProfilePicture(user.uid, selectedFile);
      await updateUserProfile(user.uid, { displayName: displayName.trim(), bio: bio.trim(), role: role.trim(), photoURL: finalPhotoURL });
      setPhotoURL(finalPhotoURL);
      setSelectedFile(null);
      setPreviewURL('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save profile:', e);
      setError('Failed to save. Check your Cloudinary preset is set to Unsigned.');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = previewURL || photoURL;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-card-border pb-5 mb-8">
        <Link to="/dashboard" className="p-2 border border-card-border text-gray-500 hover:text-foreground hover:border-foreground transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary mb-0.5">● The Voices</div>
          <h1 className="text-2xl font-black font-heading uppercase text-foreground">Account Settings</h1>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 bg-red-950/40 border border-red-900/50 px-4 py-3 mb-6 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}
      {saved && (
        <div className="flex items-start gap-3 bg-green-950/40 border border-green-900/50 px-4 py-3 mb-6 text-sm text-green-400">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-sans">Profile saved successfully.</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Avatar section */}
        <div className="border border-card-border bg-card p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-5 pb-3 border-b border-card-border">
            Profile Photo
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group flex-shrink-0">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="w-24 h-24 object-cover rounded-full border-2 border-card-border" />
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-card-border bg-background flex items-center justify-center">
                  <UserCircle className="w-14 h-14 text-gray-700" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Change photo"
              >
                <Camera className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold uppercase tracking-widest border border-card-border px-4 py-2 text-gray-400 hover:text-foreground hover:border-foreground transition-all"
              >
                Change Photo
              </button>
              {selectedFile && <p className="text-[10px] text-gray-600 font-sans mt-2">{selectedFile.name}</p>}
              <p className="text-[10px] text-gray-700 font-sans mt-1">Max size: 5MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {profile && (
              <div className="ml-auto">
                <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 border border-card-border text-gray-500">
                  {profile.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="border border-card-border bg-card p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-5 pb-3 border-b border-card-border">
            Public Profile
          </div>
          <div className="flex flex-col gap-5">
            {/* Display Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Display Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-background border border-card-border px-4 py-3 text-sm text-foreground font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-gray-700"
                placeholder="Your name as shown on articles"
              />
            </div>

            {/* Professional Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Professional Title / Position
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-background border border-card-border px-4 py-3 text-sm text-foreground font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-gray-700"
                placeholder="e.g. Senior Reporter, Political Analyst..."
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                className="w-full bg-background border border-card-border px-4 py-3 text-sm text-foreground font-sans resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-gray-700"
                placeholder="Tell your readers who you are..."
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Email Address <span className="text-gray-700">(cannot be changed)</span>
              </label>
              <p className="font-sans text-sm text-gray-600 px-4 py-3 border border-card-border bg-background/50">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link
            to={`/profile/${user.uid}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Profile
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-foreground text-background text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all disabled:opacity-40"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
