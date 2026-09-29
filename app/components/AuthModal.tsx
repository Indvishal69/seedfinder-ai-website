'use client';

import { useState, FormEvent } from 'react';
import { signUpWithEmail, loginWithEmail, loginWithGoogle, getEmailByUsername } from '../lib/firebase';
import { useAuth } from './AuthContext';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    onClose();
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const identifier = email.trim();
    if (!identifier || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(identifier, password);
      } else {
        let targetEmail = identifier;
        // If no @ symbol, treat input as username and lookup email
        if (!identifier.includes('@')) {
          const resolvedEmail = await getEmailByUsername(identifier);
          if (!resolvedEmail) {
            setError(`No account found for username "${identifier}".`);
            setLoading(false);
            return;
          }
          targetEmail = resolvedEmail;
        }
        await loginWithEmail(targetEmail, password);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      if (message.includes('user-not-found')) setError('No account found with this email or username.');
      else if (message.includes('wrong-password') || message.includes('invalid-credential')) setError('Incorrect password.');
      else if (message.includes('email-already-in-use')) setError('An account with this email already exists.');
      else if (message.includes('invalid-email')) setError('Please enter a valid email address or username.');
      else if (message.includes('too-many-requests')) setError('Too many attempts. Please try again later.');
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      if (message.includes('popup-closed')) setError('Login popup was closed.');
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close">×</button>

        <div className="auth-header">
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <img src="/logo.jpg" alt="SeedFinder AI" style={{ width: 72, height: 72, borderRadius: 12, margin: '0 auto', display: 'block', border: '2px solid #555', boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }} />
          </div>
          <h2>{mode === 'login' ? 'Welcome Back' : 'Join SeedFinder AI'}</h2>
          <p>{mode === 'login' ? 'Sign in to save your favorite seeds' : 'Create an account to unlock all features'}</p>
        </div>

        <button
          className="google-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="auth-email">{mode === 'login' ? 'Email or Username' : 'Email'}</label>
            <input
              id="auth-email"
              type={mode === 'login' ? 'text' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? 'player@minecraft.com or Steve' : 'player@minecraft.com'}
              autoComplete={mode === 'login' ? 'username' : 'email'}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm">Confirm Password</label>
              <input
                id="auth-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <div className="auth-error">⚠️ {error}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <><span className="loader" /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>Don&apos;t have an account? <button type="button" onClick={() => { setMode('signup'); setError(''); }}>Sign up free</button></p>
          ) : (
            <p>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
