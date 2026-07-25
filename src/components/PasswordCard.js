import { useState } from 'react';
import { Eye, EyeOff, Edit, Heart, ExternalLink, Copy, Check, Trash2 } from 'lucide-react';
import { encryptData } from '@/lib/crypto';

export default function PasswordCard({ record, masterPassword, onEditClick, onDeleteClick, onToggleFavorite }) {
  const [isVisible, setIsVisible] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (isUpdatingFavorite) return;

    const nextFavoriteState = !record.isFavorite;

    // Optimistically update the UI instantly
    onToggleFavorite(record.id, nextFavoriteState);
    setIsUpdatingFavorite(true);

    try {
      // Re-encrypt values to sync with the sheet structure
      const encryptedTitle = encryptData(record.title, masterPassword);
      const encryptedUrl = encryptData(record.url, masterPassword);
      const encryptedUsername = encryptData(record.username, masterPassword);
      const encryptedPassword = encryptData(record.password, masterPassword);

      const payload = {
        id: record.id,
        title: encryptedTitle,
        url: encryptedUrl,
        username: encryptedUsername,
        password: encryptedPassword,
        isFavorite: nextFavoriteState
      };

      const res = await fetch('/api/passwords', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle favorite');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert the state back if the save fails
      onToggleFavorite(record.id, record.isFavorite);
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  // Format URL for displaying and linking
  const getCleanUrl = (urlStr) => {
    if (!urlStr) return '#';
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      return urlStr;
    }
    return `https://${urlStr}`;
  };

  return (
    <div className="glass-card" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '1rem',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '200px'
    }}>
      <div className="glass-glare"></div>

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '1rem' }}>
          <h4 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {record.title}
          </h4>
          <a
            href={getCleanUrl(record.url)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.25rem',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            className="hover-underline"
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.url}
            </span>
            <ExternalLink size={12} style={{ flexShrink: 0 }} />
          </a>
        </div>

        {/* Favorite Icon */}
        <button
          onClick={handleToggleFavorite}
          disabled={isUpdatingFavorite}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            backgroundColor: record.isFavorite ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${record.isFavorite ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)'}`,
            color: record.isFavorite ? 'var(--accent-favorite)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: record.isFavorite ? '0 0 8px 0 var(--accent-favorite-glow)' : 'none'
          }}
          className="favorite-button"
        >
          <Heart size={16} fill={record.isFavorite ? 'var(--accent-favorite)' : 'none'} />
        </button>
      </div>

      {/* Account Details Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.02)',
        boxShadow: 'var(--shadow-skeuo-inset)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Username Row (Click to Copy) */}
        <div
          onClick={() => copyToClipboard(record.username, 'user')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
          title="Click to copy Username"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Username</span>
            {copiedUser && (
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-success)', fontWeight: '600', animation: 'fade-in 0.2s' }}>
                Copied!
              </span>
            )}
          </div>
          <span style={{
            fontSize: '0.9rem',
            color: isVisible ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: '500',
            fontFamily: isVisible ? 'inherit' : 'monospace',
            letterSpacing: isVisible ? 'normal' : '0.15em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block'
          }}>
            {isVisible ? record.username : '••••••••'}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.04)' }} />

        {/* Password Row (Click to Copy) */}
        <div
          onClick={() => copyToClipboard(record.password, 'pass')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
          title="Click to copy Password"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Password</span>
            {copiedPass && (
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-success)', fontWeight: '600', animation: 'fade-in 0.2s' }}>
                Copied!
              </span>
            )}
          </div>
          <span style={{
            fontSize: '0.9rem',
            color: isVisible ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: '500',
            fontFamily: 'monospace',
            letterSpacing: isVisible ? 'normal' : '0.15em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block'
          }}>
            {isVisible ? record.password : '••••••••••••'}
          </span>
        </div>
      </div>

      {/* Actions Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: '0.25rem',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Toggle View button */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="btn-raised"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderRadius: '8px',
            gap: '0.35rem'
          }}
        >
          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isVisible ? 'Hide' : 'Reveal'}</span>
        </button>

        <div style={{ display: 'flex', gap: '0.50rem' }}>
          {/* Edit Button */}
          <button
            onClick={() => onEditClick(record)}
            className="btn-raised"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              color: 'var(--text-secondary)'
            }}
            title="Edit Details"
          >
            <Edit size={14} />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDeleteClick(record.id)}
            className="btn-raised btn-danger-trigger"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'none',
              borderColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              boxShadow: 'none'
            }}
            title="Delete Password"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .hover-underline:hover {
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
}
