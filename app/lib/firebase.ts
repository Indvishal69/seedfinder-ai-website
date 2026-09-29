'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  remove,
  update,
  query,
  limitToLast,
  orderByChild,
  Database
} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBwws4kYSxudUGcizI-hF0_XRTTNtHzJnE",
  authDomain: "sentinel-ai-67499.firebaseapp.com",
  databaseURL: "https://sentinel-ai-67499-default-rtdb.firebaseio.com",
  projectId: "sentinel-ai-67499",
  storageBucket: "sentinel-ai-67499.firebasestorage.app",
  messagingSenderId: "18177291936",
  appId: "1:18177291936:web:4957da75f5130878b33bc5",
  measurementId: "G-N6KJ96TLWX"
};

let app: FirebaseApp;
let auth: Auth;
let db: Database;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getDatabase(app);

const googleProvider = new GoogleAuthProvider();

// Auth functions
export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function logoutUser() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Database functions for user data
export async function saveUserFavorite(userId: string, seed: Record<string, unknown>) {
  const favRef = push(ref(db, `users/${userId}/favorites`));
  return set(favRef, { ...seed, savedAt: new Date().toISOString() });
}

export async function getUserFavorites(userId: string) {
  const snapshot = await get(ref(db, `users/${userId}/favorites`));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([key, value]) => ({ id: key, ...(value as Record<string, unknown>) }));
}

export async function removeUserFavorite(userId: string, favoriteId: string) {
  return remove(ref(db, `users/${userId}/favorites/${favoriteId}`));
}

export async function saveSearchHistory(userId: string, query: string) {
  const histRef = push(ref(db, `users/${userId}/searchHistory`));
  return set(histRef, { query, timestamp: new Date().toISOString() });
}

export async function getSearchHistory(userId: string) {
  const snapshot = await get(ref(db, `users/${userId}/searchHistory`));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  const history = Object.entries(data).map(([key, value]) => {
    const val = value as Record<string, unknown>;
    return { id: key, ...val } as { id: string, timestamp?: string, query?: string };
  });
  
  return history
    .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
    .slice(0, 50);
}

export async function saveUserProfile(userId: string, profile: Record<string, unknown>) {
  const profileRef = ref(db, `users/${userId}`);
  
  if (profile.username) {
    const usernameLower = String(profile.username).toLowerCase();
    const usernameRef = ref(db, `usernames/${usernameLower}`);
    await set(usernameRef, userId);
    
    if (profile.email) {
      const emailRef = ref(db, `username_to_email/${usernameLower}`);
      await set(emailRef, profile.email);
    }
  }
  
  return set(profileRef, profile);
}

export async function getUserProfile(userId: string) {
  const snapshot = await get(ref(db, `users/${userId}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function getUserByUsername(username: string) {
  const usernameLower = username.toLowerCase();
  const uidSnapshot = await get(ref(db, `usernames/${usernameLower}`));
  if (!uidSnapshot.exists()) return null;
  
  const uid = uidSnapshot.val();
  const profileSnapshot = await get(ref(db, `users/${uid}`));
  return profileSnapshot.exists() ? { uid, ...profileSnapshot.val() } : null;
}

export async function getEmailByUsername(username: string): Promise<string | null> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return null;
  
  // 1. Direct index
  const directSnap = await get(ref(db, `username_to_email/${clean}`));
  if (directSnap.exists() && directSnap.val()) {
    return directSnap.val();
  }
  
  // 2. uid mapping
  const uidSnap = await get(ref(db, `usernames/${clean}`));
  if (uidSnap.exists() && uidSnap.val()) {
    const uid = uidSnap.val();
    const userSnap = await get(ref(db, `users/${uid}`));
    if (userSnap.exists() && userSnap.val().email) {
      // Backfill index for next time
      set(ref(db, `username_to_email/${clean}`), userSnap.val().email);
      return userSnap.val().email;
    }
  }
  
  // 3. Fallback scan users
  const usersSnap = await get(ref(db, 'users'));
  if (usersSnap.exists()) {
    const allUsers = usersSnap.val();
    for (const val of Object.values(allUsers) as any[]) {
      if (val?.username && String(val.username).toLowerCase() === clean && val.email) {
        set(ref(db, `username_to_email/${clean}`), val.email);
        return val.email;
      }
    }
  }
  
  return null;
}

export async function checkUsernameAvailable(username: string) {
  const usernameLower = username.toLowerCase();
  const snapshot = await get(ref(db, `usernames/${usernameLower}`));
  return !snapshot.exists();
}

// ========================
// Posts & Social Feed
// ========================

export type Post = {
  id: string;
  authorId: string;
  title: string;
  content: string;
  images: string[];
  seedData?: string; // Optional seed associated
  tags?: string[]; // Optional tags
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isPinned?: boolean;
  author?: {
    username: string;
    displayName: string;
    photoURL: string;
    verified: boolean;
  };
};

export async function createPost(
  authorId: string, 
  title: string, 
  content: string, 
  images: string[] = [], 
  seedData: string = '',
  tags: string[] = []
): Promise<Post> {
  const postRef = push(ref(db, 'posts'));
  const newPost: Post = {
    id: postRef.key as string,
    authorId,
    title,
    content,
    images,
    seedData,
    tags,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString()
  };
  await set(postRef, newPost);
  return newPost;
}

export async function getFeed(limitCount: number = 20): Promise<Post[]> {
  // Fetching all public posts for now. We will filter by "following" later.
  const postsSnapshot = await get(query(ref(db, 'posts'), limitToLast(limitCount)));
  if (!postsSnapshot.exists()) return [];
  
  const posts: Post[] = [];
  postsSnapshot.forEach((child) => {
    posts.push(child.val() as Post);
  });
  
  // Sort descending (newest first)
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Hydrate with author data
  for (let post of posts) {
    const authorProfile = await getUserProfile(post.authorId);
    if (authorProfile) {
      post.author = {
        username: authorProfile.username || 'unknown',
        displayName: authorProfile.displayName || 'Unknown',
        photoURL: authorProfile.photoURL || '',
        verified: authorProfile.verified || false,
      };
    }
  }
  
  return posts;
}

export async function getFollowingFeed(currentUserId: string, limitCount: number = 20): Promise<Post[]> {
  // Get all followings
  const followingSnap = await get(ref(db, `following/${currentUserId}`));
  if (!followingSnap.exists()) return [];
  
  const followingIds = Object.keys(followingSnap.val());
  
  // For a real production app, we would query posts where authorId in followingIds or fan-out.
  // For MVP, we will fetch recent posts and filter, or fetch per user and combine.
  // Easiest MVP: Fetch last 100 posts, filter by followingIds, sort, slice.
  const postsSnapshot = await get(query(ref(db, 'posts'), limitToLast(100)));
  if (!postsSnapshot.exists()) return [];
  
  let posts: Post[] = [];
  postsSnapshot.forEach((child) => {
    const post = child.val() as Post;
    if (followingIds.includes(post.authorId) || post.authorId === currentUserId) {
      posts.push(post);
    }
  });
  
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  posts = posts.slice(0, limitCount);
  
  // Hydrate
  for (let post of posts) {
    const authorProfile = await getUserProfile(post.authorId);
    if (authorProfile) {
      post.author = {
        username: authorProfile.username || 'unknown',
        displayName: authorProfile.displayName || 'Unknown',
        photoURL: authorProfile.photoURL || '',
        verified: authorProfile.verified || false,
      };
    }
  }
  
  return posts;
}

// ========================
// Social Engagement
// ========================

export async function toggleFollowUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  if (currentUserId === targetUserId) return false;
  const followingRef = ref(db, `following/${currentUserId}/${targetUserId}`);
  const followerRef = ref(db, `followers/${targetUserId}/${currentUserId}`);
  
  const currentProfileRef = ref(db, `users/${currentUserId}/followingCount`);
  const targetProfileRef = ref(db, `users/${targetUserId}/followerCount`);

  const snapshot = await get(followingRef);
  const isFollowing = snapshot.exists();

  const updates: Record<string, any> = {};
  if (isFollowing) {
    updates[`following/${currentUserId}/${targetUserId}`] = null;
    updates[`followers/${targetUserId}/${currentUserId}`] = null;
    // We would ideally use transactions here for precise counts, but client-side set is okay for MVP
    const targetSnap = await get(targetProfileRef);
    const currentSnap = await get(currentProfileRef);
    updates[`users/${targetUserId}/followerCount`] = Math.max(0, (targetSnap.val() || 0) - 1);
    updates[`users/${currentUserId}/followingCount`] = Math.max(0, (currentSnap.val() || 0) - 1);
  } else {
    updates[`following/${currentUserId}/${targetUserId}`] = true;
    updates[`followers/${targetUserId}/${currentUserId}`] = true;
    const targetSnap = await get(targetProfileRef);
    const currentSnap = await get(currentProfileRef);
    updates[`users/${targetUserId}/followerCount`] = (targetSnap.val() || 0) + 1;
    updates[`users/${currentUserId}/followingCount`] = (currentSnap.val() || 0) + 1;
  }
  
  await update(ref(db), updates);
  return !isFollowing;
}

export async function checkIsFollowing(currentUserId: string, targetUserId: string) {
  const snapshot = await get(ref(db, `following/${currentUserId}/${targetUserId}`));
  return snapshot.exists();
}

export async function toggleLikePost(userId: string, postId: string) {
  const likeRef = ref(db, `postLikes/${postId}/${userId}`);
  const postRef = ref(db, `posts/${postId}/likeCount`);
  
  const snapshot = await get(likeRef);
  const isLiked = snapshot.exists();
  
  const updates: Record<string, any> = {};
  const postSnap = await get(postRef);
  
  if (isLiked) {
    updates[`postLikes/${postId}/${userId}`] = null;
    updates[`posts/${postId}/likeCount`] = Math.max(0, (postSnap.val() || 0) - 1);
  } else {
    updates[`postLikes/${postId}/${userId}`] = true;
    updates[`posts/${postId}/likeCount`] = (postSnap.val() || 0) + 1;
  }
  
  await update(ref(db), updates);
  return !isLiked;
}

export type Comment = {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  replyToId?: string | null;
  replyToUsername?: string | null;
  replyToName?: string | null;
  author?: {
    username: string;
    displayName: string;
    photoURL: string;
    verified: boolean;
  };
};

export async function addComment(
  postId: string,
  authorId: string,
  content: string,
  replyToId?: string | null,
  replyToUsername?: string | null,
  replyToName?: string | null
) {
  const commentRef = push(ref(db, `postComments/${postId}`));
  const newComment: Comment = {
    id: commentRef.key as string,
    authorId,
    content,
    createdAt: new Date().toISOString(),
    ...(replyToId ? { replyToId, replyToUsername: replyToUsername || null, replyToName: replyToName || null } : {})
  };
  
  const updates: Record<string, any> = {};
  updates[`postComments/${postId}/${commentRef.key}`] = newComment;
  
  const postSnap = await get(ref(db, `posts/${postId}/commentCount`));
  updates[`posts/${postId}/commentCount`] = (postSnap.val() || 0) + 1;
  
  await update(ref(db), updates);
  return newComment;
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  const snapshot = await get(ref(db, `postComments/${postId}`));
  if (!snapshot.exists()) return [];
  
  const comments: Comment[] = [];
  snapshot.forEach(child => {
    comments.push(child.val() as Comment);
  });
  
  for (let c of comments) {
    const authorProfile = await getUserProfile(c.authorId);
    if (authorProfile) {
      c.author = {
        username: authorProfile.username || 'unknown',
        displayName: authorProfile.displayName || 'Unknown',
        photoURL: authorProfile.photoURL || '',
        verified: authorProfile.verified || false,
      };
    }
  }
  
  return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// ========================
// Pin Post Support
// ========================

export async function togglePinPost(userId: string, postId: string): Promise<boolean> {
  const userPinnedRef = ref(db, `users/${userId}/pinnedPostId`);
  const snap = await get(userPinnedRef);
  const currentPinnedId = snap.exists() ? snap.val() : null;
  
  const isCurrentlyPinned = currentPinnedId === postId;
  const newPinnedId = isCurrentlyPinned ? null : postId;
  await set(userPinnedRef, newPinnedId);
  return !isCurrentlyPinned;
}

export async function getPinnedPostId(userId: string): Promise<string | null> {
  const snap = await get(ref(db, `users/${userId}/pinnedPostId`));
  return snap.exists() ? snap.val() : null;
}

// ========================
// User Posts (Latest / Viral / Pinned)
// ========================

export async function getUserPosts(userId: string): Promise<Post[]> {
  const postsSnapshot = await get(query(ref(db, 'posts'), limitToLast(100)));
  if (!postsSnapshot.exists()) return [];

  const authorProfile = await getUserProfile(userId);
  const pinnedPostId = await getPinnedPostId(userId);

  const posts: Post[] = [];
  postsSnapshot.forEach((child) => {
    const p = child.val() as Post;
    if (p.authorId === userId) {
      p.isPinned = pinnedPostId === p.id;
      if (authorProfile) {
        p.author = {
          username: authorProfile.username || 'unknown',
          displayName: authorProfile.displayName || 'Unknown',
          photoURL: authorProfile.photoURL || '',
          verified: authorProfile.verified || false,
        };
      }
      posts.push(p);
    }
  });

  return posts;
}

// ========================
// Followers & Following Lists
// ========================

export type SocialUser = {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
  bio: string;
  verified: boolean;
  followerCount?: number;
  followingCount?: number;
};

export async function getUserFollowers(userId: string): Promise<SocialUser[]> {
  const snap = await get(ref(db, `followers/${userId}`));
  if (!snap.exists()) return [];
  
  const uids = Object.keys(snap.val());
  const users: SocialUser[] = [];
  for (const uid of uids) {
    const p = await getUserProfile(uid);
    if (p) {
      users.push({
        uid,
        username: p.username || 'miner',
        displayName: p.displayName || 'Minecraft Player',
        photoURL: p.photoURL || '',
        bio: p.bio || '',
        verified: !!p.verified,
        followerCount: p.followerCount || 0,
        followingCount: p.followingCount || 0
      });
    }
  }
  return users;
}

export async function getUserFollowing(userId: string): Promise<SocialUser[]> {
  const snap = await get(ref(db, `following/${userId}`));
  if (!snap.exists()) return [];
  
  const uids = Object.keys(snap.val());
  const users: SocialUser[] = [];
  for (const uid of uids) {
    const p = await getUserProfile(uid);
    if (p) {
      users.push({
        uid,
        username: p.username || 'miner',
        displayName: p.displayName || 'Minecraft Player',
        photoURL: p.photoURL || '',
        bio: p.bio || '',
        verified: !!p.verified,
        followerCount: p.followerCount || 0,
        followingCount: p.followingCount || 0
      });
    }
  }
  return users;
}

// ========================
// Site Ratings
// ========================

export type SiteRating = {
  id?: string;
  userId: string;
  displayName: string;
  username: string;
  photoURL?: string;
  rating: number; // 1 to 5
  feedback: string;
  createdAt: string;
};

export async function submitSiteRating(
  userId: string,
  rating: number,
  feedback: string,
  userMeta?: { displayName?: string; username?: string; photoURL?: string }
): Promise<SiteRating> {
  const userRatingRef = ref(db, `siteRatings/${userId}`);
  const ratingData: SiteRating = {
    userId,
    rating: Math.max(1, Math.min(5, rating)),
    feedback: feedback.trim(),
    displayName: userMeta?.displayName || 'Miner',
    username: userMeta?.username || 'miner',
    photoURL: userMeta?.photoURL || '',
    createdAt: new Date().toISOString()
  };
  await set(userRatingRef, ratingData);
  return ratingData;
}

export async function getSiteRatings(): Promise<{ ratings: SiteRating[]; average: number; total: number }> {
  const snap = await get(ref(db, 'siteRatings'));
  if (!snap.exists()) {
    return { ratings: [], average: 5.0, total: 0 };
  }
  
  const data = snap.val();
  const ratings: SiteRating[] = Object.entries(data).map(([key, val]) => ({
    id: key,
    ...(val as Record<string, unknown>)
  })) as SiteRating[];
  
  ratings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sum = ratings.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const average = ratings.length > 0 ? Number((sum / ratings.length).toFixed(1)) : 5.0;
  
  return { ratings, average, total: ratings.length };
}

export async function getUserSiteRating(userId: string): Promise<SiteRating | null> {
  const snap = await get(ref(db, `siteRatings/${userId}`));
  return snap.exists() ? (snap.val() as SiteRating) : null;
}

export type DirectMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

function getConversationId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join('_');
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  const convoId = getConversationId(senderId, receiverId);
  const msgRef = push(ref(db, `messages/${convoId}`));
  const newMsg: DirectMessage = {
    id: msgRef.key as string,
    senderId,
    receiverId,
    content,
    createdAt: new Date().toISOString()
  };
  await set(msgRef, newMsg);
  return newMsg;
}

export type CreatorTool = {
  id: string;
  creatorId: string;
  name: string;
  url: string;
  description: string;
  createdAt: string;
};

export async function getCreatorTools(creatorId: string): Promise<CreatorTool[]> {
  const snapshot = await get(ref(db, `creatorTools/${creatorId}`));
  if (!snapshot.exists()) return [];
  
  const tools: CreatorTool[] = [];
  snapshot.forEach(child => {
    tools.push(child.val() as CreatorTool);
  });
  return tools.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addCreatorTool(creatorId: string, name: string, url: string, description: string) {
  const toolRef = push(ref(db, `creatorTools/${creatorId}`));
  const newTool: CreatorTool = {
    id: toolRef.key as string,
    creatorId,
    name,
    url,
    description,
    createdAt: new Date().toISOString()
  };
  await set(toolRef, newTool);
  return newTool;
}

export { auth, db };
