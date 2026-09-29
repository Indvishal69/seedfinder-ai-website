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
import { POPULAR_TAGS, ALL_MINECRAFT_TAGS, searchTags } from '../lib/tags';
import Link from 'next/link';

export default function FeedPage() {
  const { user, profile } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postSeed, setPostSeed] = useState('');
  const [postTags, setPostTags] = useState<string[]>(['MinecraftHub', 'MinecraftPost']);
  const [tagSearchInput, setTagSearchInput] = useState('');
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shareSeed = params.get('shareSeed');
      if (shareSeed) {
        setPostTitle(params.get('title') || 'Featured Minecraft Seed');
        setPostSeed(shareSeed);
        const desc = params.get('desc') || '';
        setPostContent(desc ? `${desc}\n\nSeed Code: ${shareSeed}` : `Check out this amazing seed: ${shareSeed}`);
        setPostTags(['MinecraftHub', 'SeedShowcase', 'MinecraftPost']);
        setIsModalOpen(true);
      }
      const tagParam = params.get('tag');
      if (tagParam) setSelectedTag(tagParam);
    }
  }, []);

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
      
      const newPost = await createPost(
        user.uid, 
        postTitle.trim(), 
        postContent.trim(), 
        images, 
        postSeed.trim(), 
        postTags
      );
      
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
      setPostSeed('');
      setPostTags(['MinecraftHub', 'MinecraftPost']);
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

  const filteredPosts = posts.filter(post => {
    if (!selectedTag) return true;
    const tagLower = selectedTag.toLowerCase();
    if (post.tags && post.tags.some(t => t.toLowerCase() === tagLower)) return true;
    return (
      post.title.toLowerCase().includes(tagLower) ||
      post.content.toLowerCase().includes(tagLower) ||
      (post.seedData && post.seedData.includes(tagLower))
    );
  });

  return (
    <div className="shell">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: 'var(--mc-text-yellow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⛏️</span> Social Feed
          </h2>
          {user && (
            <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
              + New Post
            </button>
          )}
        </div>
        
        {user && (
          <div className="seed-tabs" style={{ marginBottom: '16px' }}>
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

        {/* 100+ Tags Filter Scrollbar */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '12px', 
          marginBottom: '24px', 
          scrollbarWidth: 'thin' 
        }}>
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            style={{
              background: selectedTag === null ? 'var(--mc-text-yellow)' : '#222',
              color: selectedTag === null ? '#111' : '#ccc',
              border: '2px solid #444',
              padding: '6px 14px',
              fontSize: '1rem',
              fontFamily: 'var(--font-pixel-read)',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            🌟 All
          </button>
          {POPULAR_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              style={{
                background: selectedTag === tag ? 'var(--mc-text-yellow)' : '#242424',
                color: selectedTag === tag ? '#111' : '#4dedf4',
                border: selectedTag === tag ? '2px solid var(--mc-text-yellow)' : '2px solid #3d3d3d',
                padding: '6px 12px',
                fontSize: '1rem',
                fontFamily: 'var(--font-pixel-read)',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              #{tag}
            </button>
          ))}
        </div>

        {selectedTag && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1c2833', border: '1px solid var(--mc-text-blue)', padding: '8px 14px', marginBottom: '20px' }}>
            <span style={{ color: '#93c5fd', fontSize: '1.1rem', fontFamily: 'var(--font-pixel-read)' }}>
              Filtering by tag: <strong>#{selectedTag}</strong> ({filteredPosts.length} posts)
            </span>
            <button 
              type="button" 
              onClick={() => setSelectedTag(null)}
              style={{ background: 'none', border: 'none', color: '#ff6666', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕ Clear Filter
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', margin: '48px 0' }}>
            <div className="loader"></div> Loading feed...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#3f3f3f' }}>{selectedTag ? `No posts tagged with #${selectedTag}` : 'The feed is quiet.'}</h3>
            <p style={{ color: '#555555' }}>
              {selectedTag ? 'Be the first to post using this tag!' : 'Be the first to post a seed or Minecraft moment!'}
            </p>
            {user && (
              <button className="primary-btn" style={{ marginTop: '12px' }} onClick={() => setIsModalOpen(true)}>
                + Create First Post
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {filteredPosts.map((post) => (
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

                {/* Embedded Interactive Seed Box if post has seedData */}
                {post.seedData && (
                  <div style={{ 
                    background: '#131e24', 
                    border: '2px solid #2bb7c0', 
                    padding: '12px 16px', 
                    borderRadius: '3px', 
                    marginBottom: '16px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '10px' 
                  }}>
                    <div>
                      <div style={{ color: 'var(--mc-text-yellow)', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'var(--font-pixel-read)' }}>
                        ⛏️ MINECRAFT SEED
                      </div>
                      <code style={{ color: '#4dedf4', fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {post.seedData}
                      </code>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="secondary-btn" 
                        style={{ padding: '4px 10px', fontSize: '0.9rem' }}
                        onClick={() => {
                          navigator.clipboard.writeText(post.seedData!);
                          alert(`📋 Seed ${post.seedData} copied!`);
                        }}
                      >
                        📋 Copy Seed
                      </button>
                      <Link href={`/?q=${encodeURIComponent(post.seedData)}`}>
                        <button className="primary-btn" style={{ padding: '4px 10px', fontSize: '0.9rem' }}>
                          🔍 AI Finder
                        </button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Post Tags Chips */}
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {post.tags.map(tag => (
                      <span 
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        style={{ 
                          cursor: 'pointer', 
                          background: selectedTag === tag ? 'var(--mc-text-yellow)' : '#262626', 
                          color: selectedTag === tag ? '#111' : '#4dedf4', 
                          padding: '3px 8px', 
                          fontSize: '0.9rem', 
                          borderRadius: '2px', 
                          fontFamily: 'var(--font-pixel-read)',
                          fontWeight: 'bold',
                          border: '1px solid #444'
                        }}
                        title={`Filter by #${tag}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

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
                  placeholder="e.g. Quad Witch Hut & Cherry Grove Spawn!"
                  required 
                  style={{ width: '100%' }}
                />
              </div>

              <div className="auth-field">
                <label>Minecraft Seed (Optional - Connects with AI Seed Finder)</label>
                <input 
                  type="text" 
                  value={postSeed} 
                  onChange={e => setPostSeed(e.target.value)} 
                  placeholder="e.g. -74920481028472 or 865219482"
                  style={{ width: '100%', fontFamily: 'monospace', color: '#4dedf4' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px', display: 'block' }}>
                  💡 Adding a seed gives your post an interactive Seed Card with one-click copy and AI Finder exploration!
                </span>
              </div>

              <div className="auth-field">
                <label>Message (like Instagram)</label>
                <textarea 
                  value={postContent} 
                  onChange={e => setPostContent(e.target.value)} 
                  placeholder="Describe your seed, coordinates, build, or adventure..."
                  required
                  style={{ width: '100%', minHeight: '100px' }}
                />
              </div>

              {/* Tags Selector */}
              <div className="auth-field">
                <label>Tags (Select from 100+ Minecraft Tags)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {postTags.map(tag => (
                    <span 
                      key={tag} 
                      style={{ 
                        background: '#1c2833', 
                        color: '#4dedf4', 
                        border: '1px solid var(--mc-text-blue)', 
                        padding: '3px 8px', 
                        fontSize: '0.9rem', 
                        fontFamily: 'var(--font-pixel-read)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                    >
                      #{tag}
                      <button 
                        type="button" 
                        onClick={() => setPostTags(postTags.filter(t => t !== tag))}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={tagSearchInput}
                    onChange={e => setTagSearchInput(e.target.value)}
                    placeholder="Search 100+ tags (e.g. cherry, trial, speedrun)..."
                    style={{ flex: 1, fontSize: '0.95rem' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const cleaned = tagSearchInput.trim().replace(/^#/, '');
                        if (cleaned && !postTags.includes(cleaned)) {
                          setPostTags([...postTags, cleaned]);
                          setTagSearchInput('');
                        }
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="secondary-btn"
                    onClick={() => {
                      const cleaned = tagSearchInput.trim().replace(/^#/, '');
                      if (cleaned && !postTags.includes(cleaned)) {
                        setPostTags([...postTags, cleaned]);
                        setTagSearchInput('');
                      }
                    }}
                  >
                    + Add
                  </button>
                </div>

                {/* Autocomplete / Suggestions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '72px', overflowY: 'auto' }}>
                  {(tagSearchInput ? searchTags(tagSearchInput).slice(0, 10) : POPULAR_TAGS.slice(0, 12)).map(tag => {
                    const isSelected = postTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setPostTags(postTags.filter(t => t !== tag));
                          } else {
                            setPostTags([...postTags, tag]);
                          }
                        }}
                        style={{
                          background: isSelected ? 'var(--mc-text-yellow)' : '#262626',
                          color: isSelected ? '#111' : '#aaa',
                          border: isSelected ? '1px solid var(--mc-text-yellow)' : '1px solid #444',
                          padding: '2px 8px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-pixel-read)'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}#{tag}
                      </button>
                    );
                  })}
                </div>
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
                  {postImageFile ? postImageFile.name : '📸 Upload Screenshot or Image'}
                </button>
              </div>

              <button type="submit" className="primary-btn" disabled={isPosting} style={{ width: '100%', marginTop: '16px' }}>
                {isPosting ? 'Posting...' : 'Post to Minecraft Hub'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
