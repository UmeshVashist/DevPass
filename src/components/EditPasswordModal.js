import { useState, useEffect } from 'react';
import { X, Save, Key, Link, User, Globe } from 'lucide-react';
import { encryptData } from '@/lib/crypto';

export default function EditPasswordModal({ isOpen, onClose, record, masterPassword, onEditSuccess }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize values when modal opens or record changes
  useEffect(() => {
    if (record) {
      setTitle(record.title || '');
      
      // Strip http:// or https:// prefix for local editing state
      let initialUrl = record.url || '';
      if (initialUrl.startsWith('https://')) {
        initialUrl = initialUrl.substring(8);
      } else if (initialUrl.startsWith('http://')) {
        initialUrl = initialUrl.substring(7);
      }
      setUrl(initialUrl);

      setUsername(record.username || '');
      setPassword(record.password || '');
      setIsFavorite(record.isFavorite || false);
      setError('');
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

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

      // Re-encrypt the updated data
      const encryptedTitle = encryptData(title.trim(), masterPassword);
      const encryptedUrl = encryptData(finalUrl, masterPassword);
      const encryptedUsername = encryptData(username.trim(), masterPassword);
      const encryptedPassword = encryptData(password.trim(), masterPassword);

      const payload = {
        id: record.id,
        title: encryptedTitle,
        url: encryptedUrl,
        username: encryptedUsername,
        password: encryptedPassword,
        isFavorite: isFavorite,
        createdAt: record.createdAt || ''
      };

      const res = await fetch('/api/passwords', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update password');
      }

      onEditSuccess({
        id: record.id,
        title: title.trim(),
        url: finalUrl,
        username: username.trim(),
        password: password.trim(),
        isFavorite,
        createdAt: record.createdAt || ''
      });
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while updating the password.');
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
            Edit Password Details
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
                placeholder="Google, GitHub..."
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
                placeholder="email@example.com"
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

          <button
            type="submit"
            className="btn-raised btn-accent"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {isSubmitting ? (
              <span>Updating Securely...</span>
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
