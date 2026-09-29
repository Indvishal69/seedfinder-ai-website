'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  submitSiteRating, 
  getSiteRatings, 
  getUserSiteRating, 
  SiteRating 
} from '../lib/firebase';

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Work 🧱',
  2: 'Getting There 🪵',
  3: 'Solid Build ⛏️',
  4: 'Awesome Tool! 🏹',
  5: 'Diamond Tier! 💎'
};

export default function RateSiteWidget() {
  const { user, profile } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [guestName, setGuestName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [siteStats, setSiteStats] = useState<{ average: number; total: number; ratings: SiteRating[] }>({
    average: 4.9,
    total: 0,
    ratings: []
  });

  useEffect(() => {
    loadRatings();
  }, []);

  useEffect(() => {
    if (user) {
      getUserSiteRating(user.uid).then(existing => {
        if (existing) {
          setRating(existing.rating);
          setFeedback(existing.feedback || '');
        }
      }).catch(() => {});
    }
  }, [user]);

  async function loadRatings() {
    try {
      const data = await getSiteRatings();
      setSiteStats(data);
    } catch (err) {
      console.error('Error loading ratings:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const uid = user ? user.uid : `guest_${Date.now()}`;
      const displayName = user 
        ? (profile?.displayName || user.displayName || 'Miner')
        : (guestName.trim() || 'Anonymous Miner');
      const username = user 
        ? (profile?.username || 'miner')
        : displayName.toLowerCase().replace(/[^a-z0-9]/g, '');

      await submitSiteRating(uid, rating, feedback, {
        displayName,
        username,
        photoURL: profile?.photoURL || ''
      });

      setSubmitSuccess(true);
      await loadRatings();
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit rating.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <>
      {/* Floating Widget Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="rate-widget-trigger"
        aria-label="Rate this site"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 998,
          background: '#242424',
          color: 'var(--mc-text-yellow)',
          border: '3px solid #555',
          borderRightColor: '#222',
          borderBottomColor: '#222',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '1.1rem',
          fontFamily: 'var(--font-pixel)',
          cursor: 'pointer',
          borderRadius: '2px',
          transition: 'transform 0.15s, border-color 0.15s'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'var(--mc-text-yellow)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = '#555';
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>⭐</span>
        <span>Rate Site</span>
        <span style={{ 
          background: '#383838', 
          color: '#fff', 
          padding: '2px 8px', 
          borderRadius: '2px', 
          fontSize: '0.95rem',
          fontFamily: 'var(--font-pixel-read)'
        }}>
          {siteStats.total > 0 ? `${siteStats.average}★` : '5.0★'}
        </span>
      </button>

      {/* Rating Modal */}
      {isOpen && (
        <div className="auth-overlay" onClick={() => setIsOpen(false)}>
          <div 
            className="auth-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button 
              className="auth-close" 
              onClick={() => setIsOpen(false)}
              aria-label="Close rating modal"
            >
              ×
            </button>

            <div className="auth-header">
              <div className="auth-icon" style={{ fontSize: '2.5rem' }}>⭐</div>
              <h2>Rate SeedFinder AI</h2>
              <p>Your review helps us make the best Minecraft seed finder in the world!</p>
            </div>

            {/* Score Summary Banner */}
            <div style={{
              background: '#1e1e1e',
              border: '2px solid #444',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '2.2rem', color: 'var(--mc-text-yellow)', fontWeight: 'bold', fontFamily: 'var(--font-pixel)' }}>
                {siteStats.total > 0 ? siteStats.average : '5.0'} / 5.0
              </div>
              <div style={{ color: '#aaa', fontFamily: 'var(--font-pixel-read)', fontSize: '1.1rem', marginTop: '4px' }}>
                Based on {siteStats.total} community player review{siteStats.total === 1 ? '' : 's'}
              </div>
            </div>

            {submitSuccess ? (
              <div className="status-strip" style={{ textAlign: 'center', padding: '20px' }}>
                🎉 Thank you for your feedback, Miner!
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {errorMessage && <div className="auth-error">{errorMessage}</div>}

                {/* Star Selector */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'inline-flex', gap: '8px', cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{
                          fontSize: '2.4rem',
                          color: star <= activeRating ? '#ffc700' : '#4a4a4a',
                          transition: 'transform 0.1s, color 0.1s',
                          transform: star === activeRating ? 'scale(1.15)' : 'scale(1)',
                          display: 'inline-block'
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div style={{ 
                    marginTop: '8px', 
                    fontFamily: 'var(--font-pixel)', 
                    color: 'var(--mc-text-yellow)', 
                    fontSize: '1.2rem',
                    minHeight: '28px'
                  }}>
                    {RATING_LABELS[activeRating] || ''}
                  </div>
                </div>

                {/* Guest name if not logged in */}
                {!user && (
                  <div className="auth-field">
                    <label>Your Miner Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. DiamondMiner99"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                    />
                  </div>
                )}

                {/* Feedback Textarea */}
                <div className="auth-field">
                  <label>Your Feedback or Suggestions</label>
                  <textarea
                    rows={3}
                    placeholder="What do you love most? What features or seeds should we add?"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    style={{ width: '100%', minHeight: '90px' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="primary-btn" 
                  disabled={isSubmitting}
                  style={{ width: '100%', marginTop: '12px', padding: '12px' }}
                >
                  {isSubmitting ? 'Submitting...' : '⭐ Submit Rating'}
                </button>
              </form>
            )}

            {/* Recent Community Reviews */}
            {siteStats.ratings.length > 0 && (
              <div style={{ marginTop: '28px', borderTop: '2px dashed #444', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#ddd', marginBottom: '14px' }}>Recent Miner Reviews</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                  {siteStats.ratings.slice(0, 10).map((r, i) => (
                    <div 
                      key={r.id || i} 
                      style={{ 
                        background: '#1a1a1a', 
                        padding: '10px 14px', 
                        border: '1px solid #333' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--mc-text-yellow)', fontSize: '1.1rem' }}>
                          {r.displayName || 'Miner'}
                        </strong>
                        <span style={{ color: '#ffc700', fontSize: '1.1rem' }}>
                          {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                        </span>
                      </div>
                      {r.feedback && (
                        <p style={{ margin: 0, color: '#ccc', fontFamily: 'var(--font-pixel-read)', fontSize: '1.05rem' }}>
                          &ldquo;{r.feedback}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
