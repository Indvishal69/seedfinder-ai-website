'use client';

import { useAuth } from '../components/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="shell" style={{ textAlign: 'center', marginTop: '64px' }}>
        <h3 style={{ color: '#fff' }}>Please log in to view notifications.</h3>
      </div>
    );
  }

  return (
    <div className="shell" style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 style={{ color: 'var(--mc-text-yellow)', marginBottom: '24px' }}>Notifications</h2>
      
      <div className="form-card" style={{ padding: '24px', textAlign: 'center' }}>
        <h3 style={{ color: '#3f3f3f', margin: '0 0 12px' }}>🔔 All Caught Up!</h3>
        <p style={{ color: '#555555', fontFamily: 'var(--font-pixel-read)', fontSize: '1.4rem' }}>
          You have no new notifications right now. When someone likes your post, comments, or follows you, it will appear here.
        </p>
      </div>
    </div>
  );
}
