import { useState } from 'react';
import { X, Key, ShieldAlert, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { encryptData } from '@/lib/crypto';

export default function ChangeMasterPasswordModal({ isOpen, onClose, masterPassword, decryptedRecords, onPasswordChangeSuccess }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setError('All fields are mandatory.');
      return;
    }

    if (oldPassword !== masterPassword) {
      setError('Incorrect old master password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New master password must be at least 6 characters.');
      return;
    }

    if (newPassword === oldPassword) {
      setError('New password cannot be the same as the old password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Re-encrypt all normal records with the new master password
      const newEncryptedRecords = decryptedRecords.map(r => ({
        id: r.id,
        title: encryptData(r.title, newPassword),
        url: encryptData(r.url, newPassword),
        username: encryptData(r.username, newPassword),
        password: encryptData(r.password, newPassword),
        isFavorite: r.isFavorite
      }));

      // 2. Generate a new __MASTER_VERIFIER__ token encrypted with the new password
      const encryptedVerifier = encryptData('VERIFIED', newPassword);
      const newVerifierRecord = {
        id: 'master-verifier-id-' + Math.random().toString(36).substr(2, 9),
        title: '__MASTER_VERIFIER__',
        url: 'https://devpass.security',
        username: 'master-verifier',
        password: encryptedVerifier,
        isFavorite: false
      };

      // 3. Compile all records to rewrite on the server
      const payloadRecords = [newVerifierRecord, ...newEncryptedRecords];

      // 4. Send to backend
      const res = await fetch('/api/passwords/change-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: payloadRecords }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update vault password.');
      }

      // 5. Notify parent of success to update state
      onPasswordChangeSuccess(newPassword, payloadRecords);
      
      // Reset inputs
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while changing the master password.');
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
            Change Master Password
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
              Old Master Password
            </label>
            <div className="inset-input-wrapper">
              <span style={{ paddingLeft: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Key size={18} />
              </span>
              <input
                type={showPasswords ? 'text' : 'password'}
                className="inset-input"
                placeholder="Enter current master password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '0.50rem' }}
              />
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--glass-border)', margin: '0.25rem 0' }} />

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              New Master Password
            </label>
            <div className="inset-input-wrapper">
              <span style={{ paddingLeft: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Key size={18} />
              </span>
              <input
                type={showPasswords ? 'text' : 'password'}
                className="inset-input"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '0.50rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Confirm New Master Password
            </label>
            <div className="inset-input-wrapper">
              <span style={{ paddingLeft: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Key size={18} />
              </span>
              <input
                type={showPasswords ? 'text' : 'password'}
                className="inset-input"
                placeholder="Re-enter new master password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '0.50rem' }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            padding: '0.25rem 0'
          }}>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: '500'
              }}
            >
              {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>
          </div>

          <div className="glass-card" style={{
            padding: '0.85rem 1rem',
            background: 'rgba(245, 158, 11, 0.08)',
            borderColor: 'rgba(245, 158, 11, 0.25)',
            borderRadius: '14px',
            display: 'flex',
            gap: '0.65rem',
            alignItems: 'flex-start'
          }}>
            <ShieldAlert size={18} style={{ color: 'var(--accent-favorite)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Important:</strong> Changing your master password will re-encrypt all credentials. 
              Make sure to save it safely; if lost, your vault cannot be recovered.
            </p>
          </div>

          <button
            type="submit"
            className="btn-raised btn-accent"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {isSubmitting ? (
              <span>Updating Vault...</span>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Update Password</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
