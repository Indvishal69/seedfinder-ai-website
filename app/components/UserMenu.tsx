'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';

export default function UserMenu({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { user, profile, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) {
    return <div className="user-menu-skeleton" />;
  }

  if (!user) {
    return (
      <button
        className="nav-auth-btn"
        type="button"
        onClick={onOpenAuth}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Sign In
      </button>
    );
  }

  const initial = (profile?.displayName || user.email || 'U')[0].toUpperCase();
  const photoURL = user.photoURL || profile?.photoURL;

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-avatar-btn"
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="User menu"
      >
        {photoURL ? (
          <img src={photoURL} alt="" className="user-avatar-img" referrerPolicy="no-referrer" />
        ) : (
          <span className="user-avatar-initial">{initial}</span>
        )}
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="user-dropdown-avatar">
              {photoURL ? (
                <img src={photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div>
              <strong>{profile?.displayName || 'Minecraft Player'}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <div className="user-dropdown-divider" />

          <Link href={`/u/${profile?.username}`} className="user-dropdown-item" onClick={() => { setOpen(false); }}>
            <span>👤</span> My Profile
          </Link>
          <Link href="/notifications" className="user-dropdown-item" onClick={() => { setOpen(false); }}>
            <span>🔔</span> Notifications
          </Link>
          <button type="button" className="user-dropdown-item" onClick={() => { setOpen(false); }}>
            <span>❤️</span> My Favorites
          </button>
          <button type="button" className="user-dropdown-item" onClick={() => { setOpen(false); }}>
            <span>📜</span> Search History
          </button>
          <Link href="/settings" className="user-dropdown-item" onClick={() => { setOpen(false); }}>
            <span>⚙️</span> Settings
          </Link>

          <div className="user-dropdown-divider" />

          <button
            type="button"
            className="user-dropdown-item logout-item"
            onClick={async () => { setOpen(false); await logout(); }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
