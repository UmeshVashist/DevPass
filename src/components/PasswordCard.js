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

  // Determine if this credential was created within the last 24 hours
  const isNewlyAdded = () => {
    if (!record.createdAt) return false;
    const createdTime = new Date(record.createdAt).getTime();
    if (isNaN(createdTime)) return false;
    const diff = Date.now() - createdTime;
    return diff >= 0 && diff < 24 * 60 * 60 * 1000; // 24 hours
  };

  // Human-readable relative time for 24h window
  const getRelativeTime = () => {
    if (!record.createdAt) return '';
    const createdTime = new Date(record.createdAt).getTime();
    if (isNaN(createdTime)) return '';
    const diff = Math.max(0, Date.now() - createdTime);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return '';
  };

  const isNew = isNewlyAdded();
  const relativeTime = getRelativeTime();

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
        minHeight: '210px',
        position: 'relative',
      }}
    >
      <div className="glass-glare"></div>

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h4
              style={{
                fontSize: '1.15rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              {record.title}
            </h4>
            {isNew && (
              <span
                className="badge-3d-new"
                title={`Added ${relativeTime ? relativeTime : 'recently (within last 24h)'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  userSelect: 'none',
                }}
              >
                <span className="badge-pulse-dot" />
                <span>NEW</span>
                {relativeTime && (
                  <span style={{ opacity: 0.88, fontWeight: '600', fontSize: '0.62rem' }}>
                    • {relativeTime}
                  </span>
                )}
              </span>
            )}
          </div>
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
              marginTop: '0.2rem',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: '500',
            }}
            className="hover-underline"
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.url}
            </span>
            <ExternalLink size={12} style={{ flexShrink: 0 }} />
          </a>
        </div>

        {/* 3D Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          disabled={isUpdatingFavorite}
          style={{
            background: record.isFavorite ? 'rgba(245, 158, 11, 0.12)' : 'var(--glass-bg)',
            border: `1px solid ${record.isFavorite ? 'rgba(245, 158, 11, 0.4)' : 'var(--glass-border)'}`,
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '12px',
            color: record.isFavorite ? 'var(--accent-favorite)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: record.isFavorite ? '0 2px 10px 0 var(--accent-favorite-glow)' : 'var(--shadow-btn-raised)',
          }}
          className="favorite-button"
          title={record.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={16}
            fill={record.isFavorite ? 'var(--accent-favorite)' : 'none'}
            style={{
              transform: record.isFavorite ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </button>
      </div>

      {/* Account Details Area - 3D Inset Panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          padding: '0.85rem 1rem',
          borderRadius: '14px',
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-skeuo-inset)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Username Row (Click to Copy) */}
        <div
          onClick={() => copyToClipboard(record.username, 'user')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '2px 4px',
            borderRadius: '6px',
            transition: 'background 0.2s',
          }}
          title="Click to copy Username"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Username
            </span>
            {copiedUser ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={12} /> Copied!
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px', opacity: 0.7 }}>
                <Copy size={11} /> Copy
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '0.92rem',
              color: isVisible ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '500',
              fontFamily: isVisible ? 'inherit' : 'monospace',
              letterSpacing: isVisible ? 'normal' : '0.12em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {isVisible ? record.username : '••••••••'}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--glass-border)' }} />

        {/* Password Row (Click to Copy) */}
        <div
          onClick={() => copyToClipboard(record.password, 'pass')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '2px 4px',
            borderRadius: '6px',
            transition: 'background 0.2s',
          }}
          title="Click to copy Password"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Password
            </span>
            {copiedPass ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={12} /> Copied!
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px', opacity: 0.7 }}>
                <Copy size={11} /> Copy
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '0.92rem',
              color: isVisible ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '500',
              fontFamily: 'monospace',
              letterSpacing: isVisible ? 'normal' : '0.14em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {isVisible ? record.password : '••••••••••••'}
          </span>
        </div>
      </div>

      {/* Actions Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '0.25rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Toggle View button */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="btn-raised"
          style={{
            padding: '6px 14px',
            fontSize: '0.82rem',
            borderRadius: '10px',
            gap: '0.35rem',
          }}
        >
          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isVisible ? 'Hide' : 'Reveal'}</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Edit Button */}
          <button
            onClick={() => onEditClick(record)}
            className="btn-raised"
            style={{
              padding: '6px 11px',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
            }}
            title="Edit Details"
          >
            <Edit size={14} />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDeleteClick(record.id)}
            className="btn-raised"
            style={{
              padding: '6px 11px',
              borderRadius: '10px',
              borderColor: 'rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
            }}
            title="Delete Password"
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
