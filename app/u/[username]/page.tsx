'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  getUserByUsername, 
  checkIsFollowing, 
  toggleFollowUser, 
  getCreatorTools, 
  addCreatorTool, 
  CreatorTool,
  getUserPosts,
  toggleLikePost,
  addComment,
  getPostComments,
  togglePinPost,
  getPinnedPostId,
  Post,
  Comment
} from '../../lib/firebase';
import { useAuth } from '../../components/AuthContext';
import Link from 'next/link';

type PublicProfile = {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
  bio: string;
  links: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  createdAt: string;
};

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'latest' | 'viral' | 'tools'>('latest');
  const [tools, setTools] = useState<CreatorTool[]>([]);
  const [showToolForm, setShowToolForm] = useState(false);
  
  const [newToolName, setNewToolName] = useState('');
  const [newToolUrl, setNewToolUrl] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');

  // Actual Posts
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);

  // Comments & Replies
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    postId: string;
    commentId: string;
    username: string;
    displayName: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!username) return;
      try {
        setLoading(true);
        const p = await getUserByUsername(String(username));
        if (p) {
          setProfile(p as PublicProfile);
          
          // Load tools
          const creatorTools = await getCreatorTools((p as PublicProfile).uid);
          setTools(creatorTools);
          
          // Check follow status
          if (currentUser && currentUser.uid !== (p as PublicProfile).uid) {
            const following = await checkIsFollowing(currentUser.uid, (p as PublicProfile).uid);
            setIsFollowing(following);
          }

          // Fetch actual posts & pinned post
          setLoadingPosts(true);
          try {
            const [posts, pinnedId] = await Promise.all([
              getUserPosts((p as PublicProfile).uid),
              getPinnedPostId((p as PublicProfile).uid)
            ]);
            setUserPosts(posts);
            setPinnedPostId(pinnedId);
          } finally {
            setLoadingPosts(false);
          }
        } else {
          setError('User not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username, currentUser]);

  const handleToggleFollow = async () => {
    if (!currentUser || !profile) {
      alert("You need to be logged in to follow users.");
      return;
    }
    
    setIsFollowLoading(true);
    try {
      const nowFollowing = await toggleFollowUser(currentUser.uid, profile.uid);
      setIsFollowing(nowFollowing);
      
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          followerCount: Math.max(0, prev.followerCount + (nowFollowing ? 1 : -1))
        };
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update follow status.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleAddTool = async () => {
    if (!currentUser || !profile) return;
    try {
      const newTool = await addCreatorTool(profile.uid, newToolName, newToolUrl, newToolDesc);
      setTools([newTool, ...tools]);
      setNewToolName('');
      setNewToolUrl('');
      setNewToolDesc('');
      setShowToolForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add tool.");
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      alert("Please login to like posts.");
      return;
    }
    try {
      const isLiked = await toggleLikePost(currentUser.uid, postId);
      setUserPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likeCount: Math.max(0, post.likeCount + (isLiked ? 1 : -1))
          };
        }
        return post;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePinPost = async (postId: string) => {
    if (!currentUser || !profile || currentUser.uid !== profile.uid) return;
    try {
      const isNowPinned = await togglePinPost(currentUser.uid, postId);
      setPinnedPostId(isNowPinned ? postId : null);
      setUserPosts(prev => prev.map(p => ({
        ...p,
        isPinned: isNowPinned && p.id === postId
      })));
      alert(isNowPinned ? "📌 Post pinned to the top of your profile!" : "📌 Post unpinned.");
    } catch (err) {
      console.error(err);
      alert("Failed to toggle pin.");
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (openCommentsFor === postId) {
      setOpenCommentsFor(null);
      return;
    }
    setOpenCommentsFor(postId);
    if (!commentsMap[postId]) {
      const fetched = await getPostComments(postId);
      setCommentsMap(prev => ({ ...prev, [postId]: fetched }));
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!currentUser) {
      alert("Please login to comment.");
      return;
    }
    if (!newCommentText.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const replyMeta = replyingTo && replyingTo.postId === postId ? replyingTo : null;
      const newComment = await addComment(
        postId,
        currentUser.uid,
        newCommentText.trim(),
        replyMeta?.commentId || null,
        replyMeta?.username || null,
        replyMeta?.displayName || null
      );
      newComment.author = {
        username: profile?.username || 'unknown',
        displayName: profile?.displayName || 'Unknown',
        photoURL: profile?.photoURL || '',
        verified: profile?.verified || false
      };
      
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment as Comment]
      }));
      setNewCommentText('');
      setReplyingTo(null);
      
      setUserPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { ...post, commentCount: post.commentCount + 1 };
        }
        return post;
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="shell" style={{ textAlign: 'center', marginTop: '64px' }}>
        <div className="loader"></div> <span style={{ color: '#fff' }}>Loading Profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="shell">
        <div className="error-card" style={{ maxWidth: 600, margin: '48px auto' }}>
          <h3>Not Found</h3>
          <p>{error || 'This user does not exist.'}</p>
          <Link href="/">
            <button className="mc-button" style={{ marginTop: '16px' }}>Go Home</button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === profile.uid;

  // Filter & sort posts according to tab
  const displayedPosts = [...userPosts].sort((a, b) => {
    if (activeTab === 'viral') {
      const scoreA = (a.likeCount || 0) * 2 + (a.commentCount || 0);
      const scoreB = (b.likeCount || 0) * 2 + (b.commentCount || 0);
      return scoreB - scoreA;
    }
    // Latest tab: pinned posts first, then newest
    const aPinned = a.isPinned || a.id === pinnedPostId ? 1 : 0;
    const bPinned = b.isPinned || b.id === pinnedPostId ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="shell">
      {/* Profile Header Card */}
      <div className="form-card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        <div className="user-avatar-btn" style={{ width: 120, height: 120, cursor: 'default', flexShrink: 0 }}>
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="Avatar" className="user-avatar-img" />
          ) : (
            <div className="user-avatar-initial" style={{ fontSize: '3rem' }}>{profile.displayName?.charAt(0).toUpperCase()}</div>
          )}
        </div>
        
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {profile.displayName}
                {profile.verified && <span title="Verified" style={{ color: 'var(--mc-text-blue)', fontSize: '1.1rem' }}>✓</span>}
              </h2>
              <span style={{ color: '#555555', fontSize: '1.2rem', fontFamily: 'var(--font-pixel-read)' }}>
                @{profile.username}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {isOwnProfile ? (
                <Link href="/settings">
                  <button className="secondary-btn">⚙️ Edit Profile</button>
                </Link>
              ) : (
                <>
                  <button 
                    className={isFollowing ? "secondary-btn" : "primary-btn"} 
                    onClick={handleToggleFollow} 
                    disabled={isFollowLoading}
                  >
                    {isFollowing ? '✓ Following' : '+ Follow'}
                  </button>
                  <Link href={`/messages/${profile.username}`}>
                    <button className="secondary-btn">✉️ Message</button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Social Stats with Links to Followers / Following lists */}
          <div style={{ display: 'flex', gap: '24px', margin: '20px 0', fontFamily: 'var(--font-pixel-read)', fontSize: '1.2rem', color: '#3f3f3f' }}>
            <div><strong>{userPosts.length}</strong> Posts</div>
            <Link 
              href={`/u/${profile.username}/followers`} 
              style={{ textDecoration: 'none', color: 'inherit' }}
              title="View Followers"
            >
              <div style={{ cursor: 'pointer', borderBottom: '1px dotted #777' }}>
                <strong>{profile.followerCount || 0}</strong> Followers
              </div>
            </Link>
            <Link 
              href={`/u/${profile.username}/following`} 
              style={{ textDecoration: 'none', color: 'inherit' }}
              title="View Following"
            >
              <div style={{ cursor: 'pointer', borderBottom: '1px dotted #777' }}>
                <strong>{profile.followingCount || 0}</strong> Following
              </div>
            </Link>
          </div>

          <p style={{ color: '#3f3f3f', fontFamily: 'var(--font-pixel-read)', fontSize: '1.2rem', margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
            {profile.bio || 'This user prefers to keep an air of mystery.'}
          </p>

          {profile.links && (
            <a href={profile.links.startsWith('http') ? profile.links : `https://${profile.links}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mc-text-blue)', fontFamily: 'var(--font-pixel-read)', fontSize: '1.1rem' }}>
              🔗 {profile.links}
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 800, margin: '32px auto' }}>
        <div className="seed-tabs">
          <button className={`seed-tab ${activeTab === 'latest' ? 'active' : ''}`} onClick={() => setActiveTab('latest')}>
            Latest Posts ({userPosts.length})
          </button>
          <button className={`seed-tab ${activeTab === 'viral' ? 'active' : ''}`} onClick={() => setActiveTab('viral')}>
            🔥 Viral Posts
          </button>
          <button className={`seed-tab ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>
            🛠️ Tools ({tools.length})
          </button>
        </div>
        
        {/* Tools Tab Content */}
        {activeTab === 'tools' && (
          <div style={{ marginTop: '24px' }}>
            {isOwnProfile && (
              <div style={{ marginBottom: '24px', textAlign: 'right' }}>
                <button className="primary-btn" onClick={() => setShowToolForm(!showToolForm)}>
                  {showToolForm ? 'Cancel' : '+ Add Tool'}
                </button>
              </div>
            )}
            
            {showToolForm && (
              <div className="form-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--mc-text-yellow)', margin: '0 0 16px' }}>Add a New Tool</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Tool Name (e.g. Chunk Coordinates Tool)" value={newToolName} onChange={e => setNewToolName(e.target.value)} style={{ padding: '8px', fontSize: '1.2rem', fontFamily: 'var(--font-pixel-read)' }} />
                  <input type="text" placeholder="URL (e.g. https://github.com/...)" value={newToolUrl} onChange={e => setNewToolUrl(e.target.value)} style={{ padding: '8px', fontSize: '1.2rem', fontFamily: 'var(--font-pixel-read)' }} />
                  <textarea placeholder="Description" value={newToolDesc} onChange={e => setNewToolDesc(e.target.value)} style={{ padding: '8px', fontSize: '1.2rem', fontFamily: 'var(--font-pixel-read)', minHeight: '80px' }} />
                  <button className="primary-btn" onClick={handleAddTool} disabled={!newToolName.trim() || !newToolUrl.trim()}>Save Tool</button>
                </div>
              </div>
            )}
            
            {tools.length > 0 ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {tools.map(tool => (
                  <div key={tool.id} className="form-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ color: 'var(--mc-text-yellow)', margin: '0 0 8px', fontSize: '1.4rem' }}>{tool.name}</h3>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" className="secondary-btn">Open Tool ↗</a>
                    </div>
                    <p style={{ color: '#d0d0d0', fontSize: '1.2rem', margin: 0 }}>{tool.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-card" style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#3f3f3f' }}>No tools listed yet</h3>
                <p style={{ color: '#555555' }}>Check back later to see tools created by {profile.displayName}.</p>
              </div>
            )}
          </div>
        )}

        {/* Posts Tab Content (Latest & Viral) */}
        {(activeTab === 'latest' || activeTab === 'viral') && (
          <div style={{ marginTop: '24px' }}>
            {loadingPosts ? (
              <div style={{ textAlign: 'center', margin: '48px 0' }}>
                <div className="loader"></div> Loading posts...
              </div>
            ) : displayedPosts.length === 0 ? (
              <div className="empty-card" style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#3f3f3f' }}>No posts yet</h3>
                <p style={{ color: '#555555' }}>
                  {isOwnProfile ? 'Head to the Feed to publish your first post!' : `${profile.displayName} hasn't posted anything yet.`}
                </p>
                {isOwnProfile && (
                  <Link href="/feed">
                    <button className="primary-btn" style={{ marginTop: '12px' }}>Go to Feed</button>
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '24px' }}>
                {displayedPosts.map(post => {
                  const isPostPinned = post.isPinned || post.id === pinnedPostId;
                  return (
                    <div 
                      key={post.id} 
                      className="form-card" 
                      style={{ 
                        padding: '20px',
                        border: isPostPinned ? '3px solid #d4af37' : undefined 
                      }}
                    >
                      {/* Pinned Badge */}
                      {isPostPinned && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#3b2f05', border: '1px solid #d4af37', color: '#ffea79', padding: '3px 10px', fontSize: '0.95rem', marginBottom: '12px', fontWeight: 'bold' }}>
                          📌 PINNED POST
                        </div>
                      )}

                      {/* Header */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <div className="user-avatar-btn" style={{ width: 44, height: 44, cursor: 'default' }}>
                          {profile.photoURL ? (
                            <img src={profile.photoURL} className="user-avatar-img" alt={profile.displayName} />
                          ) : (
                            <span className="user-avatar-initial">{profile.displayName.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <strong style={{ color: '#3f3f3f', fontSize: '1.1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {profile.displayName}
                            {profile.verified && <span style={{ color: 'var(--mc-text-blue)' }}>✓</span>}
                          </strong>
                          <div style={{ color: '#555555', fontFamily: 'var(--font-pixel-read)', fontSize: '1rem' }}>
                            @{profile.username} • {timeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 style={{ margin: '0 0 8px', color: '#3f3f3f' }}>{post.title}</h3>
                      <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-pixel-read)', fontSize: '1.2rem', color: '#555555', whiteSpace: 'pre-wrap' }}>
                        {post.content}
                      </p>

                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div style={{ marginBottom: '16px', border: '4px solid #373737', borderRightColor: '#ffffff', borderBottomColor: '#ffffff' }}>
                          <img src={post.images[0]} style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }} alt="Post media" />
                        </div>
                      )}

                      {/* Engagement */}
                      <div style={{ display: 'flex', gap: '16px', borderTop: '2px solid #555555', paddingTop: '12px', flexWrap: 'wrap' }}>
                        <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '1rem' }} onClick={() => handleLike(post.id)}>
                          ❤️ {post.likeCount}
                        </button>
                        <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '1rem' }} onClick={() => handleToggleComments(post.id)}>
                          💬 {post.commentCount}
                        </button>
                        <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '1rem' }} onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`);
                          alert('Profile link copied to share!');
                        }}>
                          📤 Share
                        </button>
                        {isOwnProfile && (
                          <button 
                            className="secondary-btn" 
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '1rem',
                              borderColor: isPostPinned ? '#d4af37' : undefined,
                              color: isPostPinned ? '#ffea79' : undefined,
                              background: isPostPinned ? '#3b2f05' : undefined 
                            }} 
                            onClick={() => handlePinPost(post.id)}
                          >
                            {isPostPinned ? '📌 Pinned' : '📌 Pin to Top'}
                          </button>
                        )}
                      </div>

                      {/* Comments & Replies */}
                      {openCommentsFor === post.id && (
                        <div style={{ marginTop: '16px', borderTop: '2px dashed #555555', paddingTop: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            {commentsMap[post.id]?.length > 0 ? (
                              commentsMap[post.id].map(comment => (
                                <div 
                                  key={comment.id} 
                                  style={{ 
                                    background: comment.replyToId ? '#242424' : '#2c2c2c', 
                                    padding: '12px', 
                                    border: '2px solid',
                                    borderColor: comment.replyToId ? '#3a3a3a' : '#444',
                                    marginLeft: comment.replyToId ? '24px' : '0',
                                    borderLeft: comment.replyToId ? '4px solid var(--mc-text-blue)' : '2px solid #444'
                                  }}
                                >
                                  {comment.replyToUsername && (
                                    <div style={{ color: 'var(--mc-text-blue)', fontSize: '0.95rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span>↳ Replying to</span>
                                      <strong>@{comment.replyToUsername}</strong>
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Link href={`/u/${comment.author?.username}`}>
                                        <strong style={{ color: 'var(--mc-text-yellow)' }}>
                                          {comment.author?.displayName}
                                        </strong>
                                      </Link>
                                      <span style={{ color: '#888', fontSize: '0.9rem' }}>{timeAgo(comment.createdAt)}</span>
                                    </div>
                                    {currentUser && (
                                      <button 
                                        type="button"
                                        className="secondary-btn"
                                        style={{ padding: '2px 8px', fontSize: '0.85rem' }}
                                        onClick={() => {
                                          setReplyingTo({
                                            postId: post.id,
                                            commentId: comment.id,
                                            username: comment.author?.username || 'miner',
                                            displayName: comment.author?.displayName || 'Miner'
                                          });
                                        }}
                                      >
                                        ↩ Reply
                                      </button>
                                    )}
                                  </div>
                                  <p style={{ margin: 0, color: '#e0e0e0', fontSize: '1.2rem', whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                                </div>
                              ))
                            ) : (
                              <p style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>No comments yet.</p>
                            )}
                          </div>

                          {currentUser ? (
                            <div>
                              {replyingTo && replyingTo.postId === post.id && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1c2833', padding: '6px 12px', border: '1px solid var(--mc-text-blue)', marginBottom: '8px', fontSize: '1rem', color: '#93c5fd' }}>
                                  <span>Replying to <strong>@{replyingTo.username}</strong></span>
                                  <button 
                                    type="button" 
                                    onClick={() => setReplyingTo(null)}
                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    ✕ Cancel
                                  </button>
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="text"
                                  value={newCommentText}
                                  onChange={e => setNewCommentText(e.target.value)}
                                  placeholder={replyingTo && replyingTo.postId === post.id ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
                                  style={{ flex: 1 }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSubmitComment(post.id);
                                  }}
                                />
                                <button 
                                  className="primary-btn" 
                                  onClick={() => handleSubmitComment(post.id)}
                                  disabled={isSubmittingComment || !newCommentText.trim()}
                                >
                                  {replyingTo && replyingTo.postId === post.id ? 'Reply' : 'Post'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ color: '#ff5555', margin: 0 }}>Login to comment.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
