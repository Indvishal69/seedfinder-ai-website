'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  // Don't render the shared navbar on the main page since it has its own nav
  if (pathname === '/') return null;

  return (
    <>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      
      <nav className="top-nav" aria-label="Main navigation">
        <Link className="brand-lockup" href="/">
          <span className="brand-icon">⛏️</span>
          <span>SeedFinder<span className="brand-ai">AI</span></span>
        </Link>

        <button
          className="mobile-menu-btn"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`} />
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <Link href="/" className={pathname === '/' ? 'active' : ''}>
            <span className="nav-icon">🔍</span> AI Finder
          </Link>
          <Link href="/feed" className={pathname === '/feed' ? 'active' : ''}>
            <span className="nav-icon">🌍</span> Feed
          </Link>
          <Link href="/notifications" className={pathname === '/notifications' ? 'active' : ''}>
            <span className="nav-icon">🔔</span> Alerts
          </Link>
          
          <div style={{ position: 'relative', marginLeft: '12px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search Users..." 
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              style={{ background: '#1e1e1e', color: '#fff', border: '2px solid #555', padding: '6px 12px', fontSize: '1.2rem', fontFamily: 'var(--font-pixel-read)', width: '160px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchUser.trim()) {
                  window.location.href = `/u/${searchUser.trim()}`;
                  setSearchUser('');
                }
              }}
            />
          </div>
        </div>

        <UserMenu onOpenAuth={() => setShowAuthModal(true)} />
      </nav>
    </>
  );
}
