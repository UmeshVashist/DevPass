import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, AlertCircle, LogOut } from 'lucide-react';
import { encryptData, decryptData } from '@/lib/crypto';
import { useClerk } from '@clerk/nextjs';
import ThemeToggle from './ThemeToggle';

export default function MasterPasswordModal({ records, onUnlock, isLoadingRecords }) {
  const { signOut } = useClerk();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if we need to set up a new master password (no verifier record exists)
  const verifierRecord = records?.find(r => r.title === '__MASTER_VERIFIER__');
  const isNewUser = records !== null && !isLoadingRecords && !verifierRecord;

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setIsSubmitting(true);

    try {
      if (!verifierRecord) {
        throw new Error('Verifier record not found');
      }

      // Attempt to decrypt the verifier token
      const decrypted = decryptData(verifierRecord.password, password);
      if (decrypted === 'VERIFIED') {
        onUnlock(password);
      } else {
        setError('Incorrect Master Password. Please try again.');
      }
    } catch (err) {
      setError('Incorrect Master Password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Master password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Master password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Encrypt "VERIFIED" to serve as verification marker
      const encryptedVerifier = encryptData('VERIFIED', password);

      const verifierPayload = {
        id: 'master-verifier-id-' + Math.random().toString(36).substr(2, 9),
        title: '__MASTER_VERIFIER__',
        url: 'https://devpass.security',
        username: 'master-verifier',
        password: encryptedVerifier,
        isFavorite: false
      };

      const res = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifierPayload),
      });

      if (!res.ok) {
        throw new Error('Failed to save verifier record');
      }

      onUnlock(password);
    } catch (err) {
      setError('Failed to configure Master Password. Please check database connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-card modal-content" style={{ position: 'relative' }}>
        <div className="glass-glare"></div>

        {/* Top bar with Theme Switcher */}
        <div style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 20
        }}>
          <ThemeToggle size="small" />
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', position: 'relative', zIndex: 10, paddingTop: '0.5rem' }}>
          <a
            href={process.env.NEXT_PUBLIC_LAUNCHER_URL ? `${process.env.NEXT_PUBLIC_LAUNCHER_URL}/dashboard` : "https://devtech.cashms.in/dashboard"}
            style={{ textDecoration: 'none', display: 'inline-block', cursor: 'pointer' }}
            title="Go to DevTech Launcher Dashboard"
          >
            <div style={{
              display: 'inline-flex',
              padding: '1.1rem',
              borderRadius: '24px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border-bright)',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-skeuo-raised)',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <img 
                src="https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1784962617063-account-recovery.png" 
                alt="DevPass Logo" 
                style={{ width: '38px', height: '38px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </a>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
            {isNewUser ? 'Set Master Password' : 'Unlock Your Vault'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.5rem', padding: '0 0.5rem', lineHeight: 1.5 }}>
            {isNewUser 
              ? 'Create a master password to encrypt your database. Make sure to remember it, as it cannot be reset.' 
              : 'Enter your Master Password to decrypt your stored credentials locally.'}
          </p>
        </div>

        {isLoadingRecords ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-secondary)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--glass-border)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%',
              margin: '0 auto 1.25rem',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Connecting to secure vault storage...</span>
          </div>
        ) : (
          <form onSubmit={isNewUser ? handleCreate : handleUnlock} style={{ position: 'relative', zIndex: 10 }}>
            {error && (
              <div className="glass-card" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.85rem 1.1rem',
                marginBottom: '1.25rem',
                background: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                borderRadius: '14px',
                color: '#ef4444',
                fontSize: '0.88rem',
                fontWeight: '500'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Master Password
              </label>
              <div className="inset-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="inset-input"
                  placeholder={isNewUser ? 'Minimum 6 characters' : 'Enter master password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isNewUser && (
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Confirm Master Password
                </label>
                <div className="inset-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="inset-input"
                    placeholder="Repeat master password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button
                type="button"
                className="btn-raised"
                onClick={() => signOut()}
                style={{ flex: 1, padding: '0.85rem' }}
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
              <button
                type="submit"
                className="btn-raised btn-accent"
                disabled={isSubmitting}
                style={{ flex: 1.5, padding: '0.85rem' }}
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    {isNewUser ? <ShieldCheck size={18} /> : <Unlock size={18} />}
                    <span>{isNewUser ? 'Initialize Vault' : 'Unlock Vault'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
