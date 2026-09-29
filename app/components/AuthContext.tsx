'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, logoutUser, getUserProfile, saveUserProfile } from '../lib/firebase';

type UserProfile = {
  displayName?: string;
  username?: string;
  username_lower?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  links?: string;
  verified?: boolean;
  followerCount?: number;
  followingCount?: number;
  createdAt?: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {}
});

function generateDefaultUsername(email: string | null) {
  const base = email ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : 'miner';
  const randomNum = Math.floor(Math.random() * 10000);
  return `${base}${randomNum}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const p = await getUserProfile(user.uid);
      if (p) {
        setProfile(p as UserProfile);
      } else {
        const username = generateDefaultUsername(user.email);
        const newProfile: UserProfile = {
          displayName: user.displayName || user.email?.split('@')[0] || 'Minecraft Player',
          username,
          username_lower: username,
          email: user.email || '',
          photoURL: user.photoURL || '',
          bio: '',
          links: '',
          verified: false,
          followerCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString()
        };
        await saveUserProfile(user.uid, newProfile);
        setProfile(newProfile);
      }
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await getUserProfile(u.uid);
          if (p) {
            setProfile(p as UserProfile);
          } else {
            const username = generateDefaultUsername(u.email);
            const newProfile: UserProfile = {
              displayName: u.displayName || u.email?.split('@')[0] || 'Minecraft Player',
              username,
              username_lower: username,
              email: u.email || '',
              photoURL: u.photoURL || '',
              bio: '',
              links: '',
              verified: false,
              followerCount: 0,
              followingCount: 0,
              createdAt: new Date().toISOString()
            };
            await saveUserProfile(u.uid, newProfile);
            setProfile(newProfile);
          }
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function logout() {
    await logoutUser();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
