'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getUserByUsername, 
  getUserFollowers, 
  getUserFollowing, 
  checkIsFollowing, 
  toggleFollowUser, 
  SocialUser 
} from '../lib/firebase';
import { useAuth } from './AuthContext';

type Props = {
  username: string;
  initialTab: 'followers' | 'following';
};

export default function FollowListClient({ username, initialTab }: Props) {
  const { user: currentUser } = useAuth();

  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track follow status for users in the list
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const userProfile = await getUserByUsername(username);
        if (!userProfile) {
          setTargetUser(null);
          return;
        }
        setTargetUser(userProfile);

        const [followersList, followingList] = await Promise.all([
          getUserFollowers(userProfile.uid),
          getUserFollowing(userProfile.uid)
        ]);

        setFollowers(followersList);
        setFollowing(followingList);

        // Check if currentUser is following any of these users
        if (currentUser) {
          const allUids = Array.from(new Set([...followersList.map(u => u.uid), ...followingList.map(u => u.uid)]));
          const map: Record<string, boolean> = {};
          await Promise.all(
            allUids.map(async (uid) => {
              if (uid === currentUser.uid) return;
              const isF = await checkIsFollowing(currentUser.uid, uid);
              map[uid] = isF;
            })
          );
          setFollowingMap(map);
        }
      } catch (err) {
        console.error('Failed to load followers/following:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [username, currentUser]);

  const handleToggleFollow = async (targetUid: string) => {
    if (!currentUser) {
      alert("Please login to follow users.");
      return;
    }
    setFollowLoadingMap(prev => ({ ...prev, [targetUid]: true }));
    try {
      const nowFollowing = await toggleFollowUser(currentUser.uid, targetUid);
      setFollowingMap(prev => ({ ...prev, [targetUid]: Boolean(nowFollowing) }));
    } catch (err) {
      console.error(err);
      alert("Failed to update follow status.");
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [targetUid]: false }));
    }
  };

  const listToShow = activeTab === 'followers' ? followers : following;
  const filteredList = listToShow.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="shell" style={{ textAlign: 'center', marginTop: '64px' }}>
        <div className="loader"></div>
        <p style={{ color: '#fff', marginTop: '16px' }}>Loading network...</p>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="shell">
        <div className="error-card" style={{ maxWidth: 600, margin: '48px auto' }}>
          <h3>User Not Found</h3>
          <p>The player @{username} does not exist.</p>
          <Link href="/feed">
            <button className="mc-button" style={{ marginTop: '16px' }}>Back to Feed</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        
        {/* Navigation & Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link 
            href={`/u/${targetUser.username}`} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: 'var(--mc-text-yellow)', 
              textDecoration: 'none', 
              fontFamily: 'var(--font-pixel-read)', 
              fontSize: '1.2rem',
              marginBottom: '16px'
            }}
          >
            ← Back to @{targetUser.username}&apos;s Profile
          </Link>

          <div className="form-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="user-avatar-btn" style={{ width: 56, height: 56, cursor: 'default' }}>
              {targetUser.photoURL ? (
                <img src={targetUser.photoURL} alt={targetUser.displayName} className="user-avatar-img" />
              ) : (
                <span className="user-avatar-initial" style={{ fontSize: '1.5rem' }}>{targetUser.displayName?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {targetUser.displayName}
                {targetUser.verified && <span style={{ color: 'var(--mc-text-blue)' }}>✓</span>}
              </h2>
              <span style={{ color: '#555', fontFamily: 'var(--font-pixel-read)', fontSize: '1.1rem' }}>
                @{targetUser.username}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="seed-tabs" style={{ marginBottom: '20px' }}>
          <button 
            className={`seed-tab ${activeTab === 'followers' ? 'active' : ''}`}
            onClick={() => setActiveTab('followers')}
          >
            👥 Followers ({followers.length})
          </button>
          <button 
            className={`seed-tab ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            ✨ Following ({following.length})
          </button>
        </div>

        {/* Filter Input */}
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text"
            placeholder={`🔍 Filter ${activeTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', fontSize: '1.2rem', fontFamily: 'var(--font-pixel-read)' }}
          />
        </div>

        {/* Users List */}
        {filteredList.length === 0 ? (
          <div className="empty-card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#3f3f3f' }}>
              {searchQuery ? 'No matching players found' : activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </h3>
            <p style={{ color: '#555555' }}>
              {searchQuery 
                ? 'Try a different search term.' 
                : activeTab === 'followers' 
                  ? `@${targetUser.username} hasn't gained any followers yet.` 
                  : `@${targetUser.username} hasn't followed any players yet.`
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredList.map(u => {
              const isSelf = currentUser?.uid === u.uid;
              const isFollowed = followingMap[u.uid] || false;
              const isUpdating = followLoadingMap[u.uid] || false;

              return (
                <div 
                  key={u.uid} 
                  className="form-card" 
                  style={{ 
                    padding: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '16px' 
                  }}
                >
                  <Link 
                    href={`/u/${u.username}`} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '14px', 
                      textDecoration: 'none', 
                      color: 'inherit',
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <div className="user-avatar-btn" style={{ width: 48, height: 48, flexShrink: 0 }}>
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="user-avatar-img" />
                      ) : (
                        <span className="user-avatar-initial">{u.displayName?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: '#3f3f3f', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.displayName}
                        {u.verified && <span style={{ color: 'var(--mc-text-blue)' }}>✓</span>}
                      </strong>
                      <div style={{ color: '#555', fontFamily: 'var(--font-pixel-read)', fontSize: '1rem' }}>
                        @{u.username}
                      </div>
                      {u.bio && (
                        <p style={{ 
                          margin: '4px 0 0', 
                          color: '#777', 
                          fontSize: '1rem', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {!isSelf && currentUser && (
                      <button 
                        className={isFollowed ? "secondary-btn" : "primary-btn"}
                        style={{ padding: '6px 12px', fontSize: '0.95rem' }}
                        onClick={() => handleToggleFollow(u.uid)}
                        disabled={isUpdating}
                      >
                        {isFollowed ? 'Unfollow' : 'Follow'}
                      </button>
                    )}
                    <Link href={`/u/${u.username}`}>
                      <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '0.95rem' }}>
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
