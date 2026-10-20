import { useState, useEffect } from 'react';
import { X, Plus, Key, Link, User, Globe, Heart } from 'lucide-react';
import { encryptData } from '@/lib/crypto';

export default function AddPasswordModal({ isOpen, onClose, masterPassword, onAddSuccess }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavoriteFocused, setIsFavoriteFocused] = useState(false);

  // Reset form when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setUrl('');
      setUsername('');
      setPassword('');
      setIsFavorite(false);
      setError('');
    }
  }, [isOpen]);

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
      // Prepare URL with visual prefix
      let finalUrl = url.trim();
      if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }

      // Encrypt the sensitive fields in the browser
      const encryptedTitle = encryptData(title.trim(), masterPassword);
      const encryptedUrl = encryptData(finalUrl, masterPassword);
      const encryptedUsername = encryptData(username.trim(), masterPassword);
      const encryptedPassword = encryptData(password.trim(), masterPassword);

      // Generate a unique ID for this record
      const recordId = 'pass_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      const createdAt = new Date().toISOString();

      const payload = {
        id: recordId,
        title: encryptedTitle,
        url: encryptedUrl,
        username: encryptedUsername,
        password: encryptedPassword,
        isFavorite: isFavorite,
        createdAt: createdAt
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
      setUrl('');
      setUsername('');
      setPassword('');
      setIsFavorite(false);
      
      // Decrypted representation for local updates
      onAddSuccess({
        id: recordId,
        title: title.trim(),
        url: finalUrl,
        username: username.trim(),
        password: password.trim(),
        isFavorite,
        createdAt: createdAt
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
          <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Add New Password
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              boxShadow: 'var(--shadow-btn-raised)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="glass-card" style={{
            padding: '0.85rem 1.1rem',
            marginBottom: '1.25rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.88rem',
            fontWeight: '500',
            borderRadius: '14px',
            position: 'relative',
            zIndex: 10
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 10 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
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
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              URL *
            </label>
            <div className="inset-input-wrapper" style={{ display: 'flex', alignItems: 'stretch', padding: 0, overflow: 'hidden' }}>
              <div
                className="input-prefix-tag"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 0.85rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  userSelect: 'none',
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px'
                }}
              >
                https://
              </div>
              <input
                type="text"
                className="inset-input"
                placeholder="e.g. example.com"
                value={url}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('https://')) {
                    setUrl(val.substring(8));
                  } else if (val.startsWith('http://')) {
                    setUrl(val.substring(7));
                  } else {
                    setUrl(val);
                  }
                }}
                disabled={isSubmitting}
                style={{ 
                  flex: 1, 
                  borderTopLeftRadius: 0, 
                  borderBottomLeftRadius: 0,
                  paddingLeft: '0.75rem' 
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
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
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
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

          <div
            tabIndex={0}
            onFocus={() => setIsFavoriteFocused(true)}
            onBlur={() => setIsFavoriteFocused(false)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }
            }}
            onClick={() => setIsFavorite(!isFavorite)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.5rem',
              cursor: 'pointer',
              borderRadius: '14px',
              border: isFavoriteFocused ? '1px solid var(--accent-primary)' : '1px solid transparent',
              boxShadow: isFavoriteFocused ? '0 0 10px var(--accent-glow)' : 'none',
              outline: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: isFavorite ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
            }}
          >
            <div className="btn-raised" style={{
              padding: '8px',
              borderRadius: '12px',
              backgroundColor: isFavorite ? 'rgba(245, 158, 11, 0.15)' : 'var(--glass-bg)',
              borderColor: isFavorite ? 'rgba(245, 158, 11, 0.4)' : 'var(--glass-border)',
              boxShadow: isFavorite ? '0 0 12px 0 var(--accent-favorite-glow)' : 'var(--shadow-btn-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isFavorite ? 'var(--accent-favorite)' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}>
              <Heart size={18} fill={isFavorite ? 'var(--accent-favorite)' : 'none'} />
            </div>
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Mark as Favorite
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                This credential will be highlighted and easily filtered
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn-raised btn-accent"
              disabled={isSubmitting}
              style={{ flex: 2, padding: '0.85rem' }}
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
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setUrl('');
                setUsername('');
                setPassword('');
                setIsFavorite(false);
                setError('');
              }}
              className="btn-raised"
              style={{ flex: 1, padding: '0.85rem' }}
            >
              Clear
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
