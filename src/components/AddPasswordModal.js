import { useState } from 'react';
import { X, Plus, Key, Link, User, Globe, Heart } from 'lucide-react';
import { encryptData } from '@/lib/crypto';

export default function AddPasswordModal({ isOpen, onClose, masterPassword, onAddSuccess }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('https://');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // All fields are mandatory
    if (!title.trim() || !url.trim() || !username.trim() || !password.trim()) {
      setError('All fields (Title, URL, Username, Password) are mandatory.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Encrypt the sensitive fields in the browser
      const encryptedTitle = encryptData(title.trim(), masterPassword);
      const encryptedUrl = encryptData(url.trim(), masterPassword);
      const encryptedUsername = encryptData(username.trim(), masterPassword);
      const encryptedPassword = encryptData(password.trim(), masterPassword);

      // Generate a unique ID for this record
      const recordId = 'pass_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

      const payload = {
        id: recordId,
        title: encryptedTitle,
        url: encryptedUrl,
        username: encryptedUsername,
        password: encryptedPassword,
        isFavorite: isFavorite
      };

      const res = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save password');
      }

      // Reset form and notify parent
      setTitle('');
      setUrl('https://');
      setUsername('');
      setPassword('');
      setIsFavorite(false);
      
      // Decrypted representation for local updates
      onAddSuccess({
        id: recordId,
        title: title.trim(),
        url: url.trim(),
        username: username.trim(),
        password: password.trim(),
        isFavorite
      });
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while saving the password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-card modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="glass-glare"></div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          position: 'relative',
          zIndex: 10
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Add New Password
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="glass-card" style={{
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            borderRadius: '12px',
            position: 'relative',
            zIndex: 10
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 10 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Title *
            </label>
            <div className="inset-input-wrapper">
              <span style={{ paddingLeft: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Globe size={18} />
              </span>
              <input
                type="text"
                className="inset-input"
                placeholder="Google, GitHub, Netflix..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '0.50rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              URL *
            </label>
            <div className="inset-input-wrapper">
              <span style={{ paddingLeft: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Link size={18} />
              </span>
              <input
                type="text"
                className="inset-input"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '0.50rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Username *
            </label>
            <div className="inset-input-wrapper">
              <span style={{ paddingLeft: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <User size={18} />
              </span>
              <input
                type="text"
                className="inset-input"
                placeholder="email@example.com or user123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '0.50rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Password *
            </label>
            <div className="inset-input-wrapper">
              <span style={{ paddingLeft: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Key size={18} />
              </span>
              <input
                type="password"
                className="inset-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '0.50rem' }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.25rem',
            cursor: 'pointer'
          }} onClick={() => setIsFavorite(!isFavorite)}>
            <div className="btn-raised" style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: isFavorite ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              borderColor: isFavorite ? 'rgba(245, 158, 11, 0.3)' : 'var(--glass-border)',
              boxShadow: isFavorite ? '0 0 10px 0 var(--accent-favorite-glow)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isFavorite ? 'var(--accent-favorite)' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}>
              <Heart size={18} fill={isFavorite ? 'var(--accent-favorite)' : 'none'} />
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                Mark as Favorite
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                This record will be filtered under favorites
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="btn-raised btn-accent"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {isSubmitting ? (
              <span>Saving Securely...</span>
            ) : (
              <>
                <Plus size={18} />
                <span>Save Password</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
