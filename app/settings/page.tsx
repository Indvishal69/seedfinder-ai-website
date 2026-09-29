'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { checkUsernameAvailable, saveUserProfile } from '../lib/firebase';
import { uploadImageToImgBB } from '../lib/imgbb';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setLinks(profile.links || '');
    }
  }, [profile]);

  if (!user || !profile) {
    return (
      <div className="shell">
        <div className="error-card" style={{ maxWidth: 600, margin: '48px auto' }}>
          <h3>Access Denied</h3>
          <p>You must be logged in to access settings.</p>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    
    try {
      let finalUsername = username.trim();
      
      // If changing username, check availability
      if (finalUsername !== profile.username) {
        if (finalUsername.length < 3 || finalUsername.length > 20) {
          throw new Error('Username must be 3-20 characters long.');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(finalUsername)) {
          throw new Error('Username can only contain letters, numbers, and underscores.');
        }
        const available = await checkUsernameAvailable(finalUsername);
        if (!available) {
          throw new Error('Username is already taken.');
        }
      }

      const updatedProfile = {
        ...profile,
        displayName: displayName.trim(),
        username: finalUsername,
        username_lower: finalUsername.toLowerCase(),
        bio: bio.trim(),
        links: links.trim()
      };
      
      await saveUserProfile(user.uid, updatedProfile);
      
      // Update Firebase Auth display name too
      if (displayName.trim() !== user.displayName) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      await refreshProfile();
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) { // 10MB sanity check
      setError('Image is too large. Max 10MB.');
      return;
    }
    
    setUploadingImage(true);
    setError('');
    
    try {
      const url = await uploadImageToImgBB(file);
      if (url) {
        const updatedProfile = { ...profile, photoURL: url };
        await saveUserProfile(user.uid, updatedProfile);
        await updateProfile(user, { photoURL: url });
        await refreshProfile();
        setSuccess('Avatar updated successfully!');
      } else {
        throw new Error('ImgBB upload failed.');
      }
    } catch (err) {
      setError('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="shell">
      <div className="form-card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2>Profile Settings</h2>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="status-strip" style={{ marginTop: 0, marginBottom: '24px' }}>{success}</div>}

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div className="user-avatar-btn" style={{ width: 96, height: 96, cursor: 'default' }}>
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" className="user-avatar-img" />
            ) : (
              <div className="user-avatar-initial">{profile.displayName?.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? 'Uploading...' : 'Change Avatar'}
            </button>
            <p style={{ color: '#555555', fontSize: '0.85rem', marginTop: '8px' }}>Max 10MB, via ImgBB</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="auth-field">
            <label>Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required 
            />
          </div>
          
          <div className="auth-field">
            <label>Username</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#555555', fontSize: '1.2rem', fontFamily: 'var(--font-pixel-read)' }}>@</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                required 
                style={{ flex: 1 }}
              />
            </div>
            <small style={{ color: '#555555', fontFamily: 'var(--font-pixel-read)' }}>3-20 chars, letters/numbers/underscores only.</small>
          </div>

          <div className="auth-field">
            <label>Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              style={{ minHeight: '120px' }}
              placeholder="Minecraft builder, explorer, redstone engineer..."
            />
          </div>

          <div className="auth-field">
            <label>Website / Links</label>
            <input 
              type="text" 
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="https://youtube.com/..."
              maxLength={100}
            />
          </div>

          <button type="submit" className="primary-btn" disabled={isSaving} style={{ width: '100%', marginTop: '16px' }}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <div style={{ borderTop: '4px solid #555555', marginTop: '32px', paddingTop: '32px' }}>
          <h3 style={{ color: 'var(--mc-text-yellow)', margin: '0 0 16px' }}>Change Password</h3>
          <p style={{ color: '#555555', fontFamily: 'var(--font-pixel-read)', fontSize: '1.3rem', margin: '0 0 16px' }}>
            Only available if you signed up with email/password (not Google).
          </p>
          <PasswordChangeForm user={user} />
        </div>

        <div style={{ borderTop: '4px solid #555555', marginTop: '32px', paddingTop: '24px', textAlign: 'center' }}>
          <Link href={`/u/${profile.username}`}>
            <button className="secondary-btn">View My Public Profile</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PasswordChangeForm({ user }: { user: any }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrMsg('');
    
    if (newPw.length < 6) {
      setErrMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setErrMsg('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email!, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setMsg('Password changed successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        setErrMsg('Current password is incorrect.');
      } else if (err.code === 'auth/requires-recent-login') {
        setErrMsg('Please sign out and sign back in before changing your password.');
      } else {
        setErrMsg(err.message || 'Failed to change password. You may have signed in with Google.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleChangePw}>
      {errMsg && <div className="auth-error">{errMsg}</div>}
      {msg && <div className="status-strip" style={{ marginTop: 0, marginBottom: '16px' }}>{msg}</div>}
      
      <div className="auth-field">
        <label>Current Password</label>
        <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
      </div>
      <div className="auth-field">
        <label>New Password</label>
        <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
      </div>
      <div className="auth-field">
        <label>Confirm New Password</label>
        <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6} />
      </div>
      <button type="submit" className="secondary-btn" disabled={saving} style={{ width: '100%' }}>
        {saving ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}
