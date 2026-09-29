'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { 
  createPost, 
  getFeed, 
  getFollowingFeed, 
  Post, 
  toggleLikePost, 
  addComment, 
  getPostComments, 
  Comment,
  togglePinPost,
  getPinnedPostId
} from '../lib/firebase';
import { uploadImageToImgBB } from '../lib/imgbb';
import Link from 'next/link';

export default function FeedPage() {
  const { user, profile } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [feedType, setFeedType] = useState<'global' | 'following'>('global');

  useEffect(() => {
    if (user) {
      getPinnedPostId(user.uid).then(id => setPinnedPostId(id)).catch(() => {});
    } else {
      setPinnedPostId(null);
    }
  }, [user]);

  useEffect(() => {
    loadFeed();
  }, [feedType, user]);

  async function loadFeed() {
    setLoading(true);
    setPosts([]);
    try {
      if (feedType === 'following' && user) {
        const p = await getFollowingFeed(user.uid, 30);
        setPosts(p);
      } else {
        const p = await getFeed(30);
        setPosts(p);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postTitle.trim() || !postContent.trim()) return;
    
    setIsPosting(true);
    setPostError('');
    
    try {
      let images: string[] = [];
      if (postImageFile) {
        const url = await uploadImageToImgBB(postImageFile);
        if (url) {
          images.push(url);
        } else {
          throw new Error('Image upload failed.');
        }
      }
      
      const newPost = await createPost(user.uid, postTitle.trim(), postContent.trim(), images);
      
      // Inject author data for optimistic UI
      newPost.author = {
        username: profile?.username || 'unknown',
        displayName: profile?.displayName || 'Unknown',
        photoURL: profile?.photoURL || '',
        verified: profile?.verified || false
      };
      
      setPosts([newPost, ...posts]);
      
      // Reset form
      setIsModalOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostImageFile(null);
    } catch (err: any) {
      setPostError(err.message || 'Failed to create post.');
    } finally {
      setIsPosting(false);
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

  const handleLike = async (postId: string) => {
    if (!user) {
      alert("Please login to like posts.");
      return;
    }
    try {
      const isLiked = await toggleLikePost(user.uid, postId);
      setPosts(posts.map(post => {
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

  const handlePinPost = async (postId: string) => {
    if (!user) {
      alert("Please login to pin posts.");
      return;
    }
    try {
      const isNowPinned = await togglePinPost(user.uid, postId);
      setPinnedPostId(isNowPinned ? postId : null);
      alert(isNowPinned ? "📌 Post pinned to your profile!" : "📌 Post unpinned from your profile.");
    } catch (err) {
      console.error(err);
      alert("Failed to update pin status.");
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!user) {
      alert("Please login to comment.");
      return;
    }
    if (!newCommentText.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const replyMeta = replyingTo && replyingTo.postId === postId ? replyingTo : null;
      const newComment = await addComment(
        postId,
        user.uid,
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
      
      // Update comment count on post
      setPosts(posts.map(post => {
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

  return (
    <div className="shell">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: 'var(--mc-text-yellow)' }}>Social Feed</h2>
          {user && (
            <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
              + New Post
            </button>
          )}
        </div>
        
        {user && (
          <div className="seed-tabs" style={{ marginBottom: '24px' }}>
            <button 
              className={`seed-tab ${feedType === 'global' ? 'active' : ''}`}
              onClick={() => setFeedType('global')}
            >
              🌍 Global
            </button>
            <button 
              className={`seed-tab ${feedType === 'following' ? 'active' : ''}`}
              onClick={() => setFeedType('following')}
            >
              👥 Following
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', margin: '48px 0' }}>
            <div className="loader"></div> Loading feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#3f3f3f' }}>The feed is quiet.</h3>
            <p style={{ color: '#555555' }}>Be the first to post a seed or Minecraft moment!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {posts.map((post) => (
              <div key={post.id} className="form-card" style={{ padding: '20px' }}>
                {/* Pinned badge */}
                {(post.isPinned || (user?.uid === post.authorId && pinnedPostId === post.id)) && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#3b2f05', border: '1px solid #d4af37', color: '#ffea79', padding: '3px 10px', fontSize: '0.95rem', marginBottom: '12px', fontWeight: 'bold' }}>
                    📌 PINNED POST
                  </div>
                )}

                {/* Author Header */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <Link href={`/u/${post.author?.username}`}>
                    <div className="user-avatar-btn" style={{ width: 48, height: 48 }}>
                      {post.author?.photoURL ? (
                        <img src={post.author.photoURL} className="user-avatar-img" />
                      ) : (
                        <span className="user-avatar-initial">{post.author?.displayName.charAt(0)}</span>
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link href={`/u/${post.author?.username}`} style={{ textDecoration: 'none' }}>
                      <strong style={{ color: '#3f3f3f', fontSize: '1.1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {post.author?.displayName}
                        {post.author?.verified && <span style={{ color: 'var(--mc-text-blue)' }}>✓</span>}
                      </strong>
                    </Link>
                    <div style={{ color: '#555555', fontFamily: 'var(--font-pixel-read)', fontSize: '1rem' }}>
                      @{post.author?.username} • {timeAgo(post.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <h3 style={{ margin: '0 0 8px', color: '#3f3f3f' }}>{post.title}</h3>
                <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-pixel-read)', fontSize: '1.2rem', color: '#555555', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div style={{ marginBottom: '16px', border: '4px solid #373737', borderRightColor: '#ffffff', borderBottomColor: '#ffffff' }}>
                    <img src={post.images[0]} style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }} />
                  </div>
                )}

                {/* Engagement Bar */}
                <div style={{ display: 'flex', gap: '16px', borderTop: '2px solid #555555', paddingTop: '12px', flexWrap: 'wrap' }}>
                  <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '1rem' }} onClick={() => handleLike(post.id)}>
                    ❤️ {post.likeCount}
                  </button>
                  <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '1rem' }} onClick={() => handleToggleComments(post.id)}>
                    💬 {post.commentCount}
                  </button>
                  <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '1rem' }} onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/u/${post.author?.username}`);
                    alert('Profile link copied to share!');
                  }}>
                    📤 Share
                  </button>
                  {user?.uid === post.authorId && (
                    <button 
                      className="secondary-btn" 
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '1rem',
                        borderColor: pinnedPostId === post.id ? '#d4af37' : undefined,
                        color: pinnedPostId === post.id ? '#ffea79' : undefined,
                        background: pinnedPostId === post.id ? '#3b2f05' : undefined
                      }}
                      onClick={() => handlePinPost(post.id)}
                    >
                      {pinnedPostId === post.id ? '📌 Pinned' : '📌 Pin Post'}
                    </button>
                  )}
                </div>

                {/* Comments Section */}
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
                                {comment.replyToName && <span style={{ color: '#888' }}>({comment.replyToName})</span>}
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
                              {user && (
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
                    
                    {user ? (
                      <div>
                        {replyingTo && replyingTo.postId === post.id && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1c2833', padding: '6px 12px', border: '1px solid var(--mc-text-blue)', marginBottom: '8px', fontSize: '1rem', color: '#93c5fd' }}>
                            <span>Replying to <strong>@{replyingTo.username}</strong> ({replyingTo.displayName})</span>
                            <button 
                              type="button" 
                              onClick={() => setReplyingTo(null)}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
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
            ))}
          </div>
        )}

      </div>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="auth-overlay">
          <div className="auth-modal">
            <button className="auth-close" onClick={() => setIsModalOpen(false)}>×</button>
            <div className="auth-header">
              <h2>Create a Post</h2>
              <p>Share a Minecraft seed, build, or tool!</p>
            </div>
            
            {postError && <div className="auth-error">{postError}</div>}
            
            <form onSubmit={handlePostSubmit}>
              <div className="auth-field">
                <label>Title</label>
                <input 
                  type="text" 
                  value={postTitle} 
                  onChange={e => setPostTitle(e.target.value)} 
                  maxLength={100}
                  required 
                  style={{ width: '100%' }}
                />
              </div>

              <div className="auth-field">
                <label>Message (like Instagram)</label>
                <textarea 
                  value={postContent} 
                  onChange={e => setPostContent(e.target.value)} 
                  required
                  style={{ width: '100%', minHeight: '120px' }}
                />
              </div>

              <div className="auth-field">
                <label>Add Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={e => setPostImageFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <button type="button" className="secondary-btn" onClick={() => fileInputRef.current?.click()} style={{ width: '100%' }}>
                  {postImageFile ? postImageFile.name : '📸 Upload Image'}
                </button>
              </div>

              <button type="submit" className="primary-btn" disabled={isPosting} style={{ width: '100%', marginTop: '16px' }}>
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
