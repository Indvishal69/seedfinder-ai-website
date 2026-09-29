'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { db, getUserByUsername, sendMessage, DirectMessage } from '../../lib/firebase';
import { ref, onValue, off, query, orderByChild } from 'firebase/database';
import { useAuth } from '../../components/AuthContext';
import Link from 'next/link';

export default function DirectMessagesPage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  
  const [targetUser, setTargetUser] = useState<any>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    async function loadTarget() {
      if (!username || !currentUser) return;
      try {
        const p = await getUserByUsername(String(username));
        if (p) {
          setTargetUser(p);
          subscribeToMessages(currentUser.uid, p.uid);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTarget();
    
    return () => {
      // Need to clean up listener. Since it's dynamic, we do it in subscribe
    };
  }, [username, currentUser]);

  let activeConvoRef: any = null;

  function subscribeToMessages(uid1: string, uid2: string) {
    const convoId = [uid1, uid2].sort().join('_');
    const q = query(ref(db, `messages/${convoId}`), orderByChild('createdAt'));
    
    activeConvoRef = q;
    
    onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.values(data) as DirectMessage[];
        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser || !targetUser) return;
    
    try {
      await sendMessage(currentUser.uid, targetUser.uid, text.trim());
      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) {
    return (
      <div className="shell" style={{ textAlign: 'center', marginTop: '64px' }}>
        <h3 style={{ color: '#fff' }}>Please log in to use messages.</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shell" style={{ textAlign: 'center', marginTop: '64px' }}>
        <div className="loader"></div> <span style={{ color: '#fff' }}>Loading Chat...</span>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="shell" style={{ textAlign: 'center', marginTop: '64px' }}>
        <h3 style={{ color: '#fff' }}>User not found.</h3>
      </div>
    );
  }

  return (
    <div className="shell" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ background: '#1e1e1e', padding: '16px', border: '4px solid #555', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/u/${targetUser.username}`}>
          <div className="user-avatar-btn" style={{ width: 48, height: 48 }}>
            {targetUser.photoURL ? (
              <img src={targetUser.photoURL} className="user-avatar-img" />
            ) : (
              <span className="user-avatar-initial">{targetUser.displayName?.charAt(0)}</span>
            )}
          </div>
        </Link>
        <div>
          <Link href={`/u/${targetUser.username}`} style={{ textDecoration: 'none' }}>
            <h3 style={{ margin: 0, color: 'var(--mc-text-yellow)' }}>{targetUser.displayName}</h3>
          </Link>
          <span style={{ color: '#aaa', fontSize: '1.1rem' }}>@{targetUser.username}</span>
        </div>
      </div>

      {/* Messages View */}
      <div style={{ flex: 1, background: '#2c2c2c', border: '4px solid #555', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', color: '#888', fontStyle: 'italic', fontSize: '1.2rem' }}>
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                <div style={{ 
                  background: isMe ? '#1a4e2b' : '#373737', 
                  padding: '12px 16px', 
                  border: '2px solid',
                  borderColor: isMe ? '#25703f #0c2615 #0c2615 #25703f' : '#555 #111 #111 #555',
                  color: '#fff',
                  fontSize: '1.4rem'
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#888', textAlign: isMe ? 'right' : 'left', marginTop: '4px' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div style={{ background: '#1e1e1e', padding: '16px', border: '4px solid #555', borderTop: 'none' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, fontSize: '1.3rem', padding: '12px' }}
          />
          <button type="submit" className="primary-btn" disabled={!text.trim()} style={{ fontSize: '1.3rem', padding: '0 24px' }}>
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
