'use client';

import { useState, useEffect, useMemo } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Search, Plus, Loader2, ShieldCheck, Key, Shield, Filter, AlertCircle, RefreshCw, Trash2, Heart } from 'lucide-react';
import { decryptData, encryptData } from '@/lib/crypto';
import MasterPasswordModal from '@/components/MasterPasswordModal';
import AddPasswordModal from '@/components/AddPasswordModal';
import EditPasswordModal from '@/components/EditPasswordModal';
import PasswordCard from '@/components/PasswordCard';
import ChangeMasterPasswordModal from '@/components/ChangeMasterPasswordModal';

export default function Dashboard() {
  const { user } = useUser();
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [records, setRecords] = useState(null); // RAW encrypted records from server
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'favorite' | 'unfavorite'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  // Custom Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Fetch encrypted records from the API route (connected to Google Sheets)
  const fetchRecords = async (silent = false) => {
    if (!silent) setIsLoadingRecords(true);
    try {
      const res = await fetch('/api/passwords');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      } else {
        console.error('Failed to load credentials');
        showToast('Error loading credentials from Google Sheets', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while fetching database', 'danger');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Auto-lock vault on inactivity (10 minutes)
  useEffect(() => {
    if (!isUnlocked) return;

    let timeoutId;
    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLock();
        // Delay showing toast slightly to avoid React batch state update warnings
        setTimeout(() => {
          showToast('Vault auto-locked due to inactivity.', 'danger');
        }, 100);
      }, INACTIVITY_TIMEOUT);
    };

    // Set initial timer
    resetTimer();

    // List of events that represent user activity
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isUnlocked]);

  // Decrypt records in-browser using Master Password
  const decryptedRecords = useMemo(() => {
    if (!isUnlocked || !masterPassword || !records) return [];

    return records
      .filter((r) => r.title !== '__MASTER_VERIFIER__')
      .map((r) => {
        try {
          return {
            id: r.id,
            title: decryptData(r.title, masterPassword),
            url: decryptData(r.url, masterPassword),
            username: decryptData(r.username, masterPassword),
            password: decryptData(r.password, masterPassword),
            isFavorite: r.isFavorite
          };
        } catch (e) {
          // If a row fails to decrypt, we don't crash, we just label it corrupted or bypass.
          console.error(`Could not decrypt row ${r.id}:`, e);
          return null;
        }
      })
      .filter(Boolean); // Filter out failed decryptions
  }, [records, masterPassword, isUnlocked]);

  // Handle local searching and dropdown filtering
  const filteredRecords = useMemo(() => {
    return decryptedRecords.filter((record) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        record.title.toLowerCase().includes(query) ||
        record.username.toLowerCase().includes(query);

      let matchFilter = true;
      if (filterType === 'favorite') {
        matchFilter = record.isFavorite === true;
      } else if (filterType === 'unfavorite') {
        matchFilter = record.isFavorite === false;
      }

      return matchSearch && matchFilter;
    });
  }, [decryptedRecords, searchQuery, filterType]);

  const handleUnlock = (password) => {
    setMasterPassword(password);
    setIsUnlocked(true);
    showToast('Vault unlocked successfully!');
  };

  const handleLock = () => {
    setMasterPassword('');
    setIsUnlocked(false);
    showToast('Vault locked.');
  };

  const handleAddSuccess = (newDecryptedRecord) => {
    // Optimistic UI update
    setRecords((prev) => {
      // Re-encrypt values to sync with raw records state structure
      const encryptedRecord = {
        userId: user?.id,
        id: newDecryptedRecord.id,
        title: encryptData(newDecryptedRecord.title, masterPassword),
        url: encryptData(newDecryptedRecord.url, masterPassword),
        username: encryptData(newDecryptedRecord.username, masterPassword),
        password: encryptData(newDecryptedRecord.password, masterPassword),
        isFavorite: newDecryptedRecord.isFavorite
      };
      return prev ? [...prev, encryptedRecord] : [encryptedRecord];
    });
    showToast('Password saved securely.');
  };

  const handleEditClick = (decryptedRecord) => {
    setEditingRecord(decryptedRecord);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedDecryptedRecord) => {
    // Optimistic UI update
    setRecords((prev) => {
      if (!prev) return prev;
      return prev.map((r) => {
        if (r.id === updatedDecryptedRecord.id) {
          return {
            userId: user?.id,
            id: updatedDecryptedRecord.id,
            title: encryptData(updatedDecryptedRecord.title, masterPassword),
            url: encryptData(updatedDecryptedRecord.url, masterPassword),
            username: encryptData(updatedDecryptedRecord.username, masterPassword),
            password: encryptData(updatedDecryptedRecord.password, masterPassword),
            isFavorite: updatedDecryptedRecord.isFavorite
          };
        }
        return r;
      });
    });
    showToast('Password updated successfully.');
  };

  const handleToggleFavoriteSuccess = (recordId, nextFavoriteState) => {
    setRecords((prev) => {
      if (!prev) return prev;
      return prev.map((r) => {
        if (r.id === recordId) {
          return { ...r, isFavorite: nextFavoriteState };
        }
        return r;
      });
    });
    showToast(nextFavoriteState ? 'Added to favorites.' : 'Removed from favorites.');
  };

  const handlePasswordChangeSuccess = (newPassword, newRawRecords) => {
    setMasterPassword(newPassword);
    setRecords(newRawRecords);
    showToast('Vault password updated and re-encrypted successfully.');
  };

  const handleDelete = async (recordId) => {
    if (!confirm('Are you sure you want to delete this password? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/passwords?id=${recordId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete password');
      }

      setRecords((prev) => (prev ? prev.filter((r) => r.id !== recordId) : prev));
      showToast('Password deleted successfully.', 'danger');
    } catch (err) {
      showToast('Failed to delete password.', 'danger');
    }
  };

  // If the vault is locked, display the Master Password Modal
  if (!isUnlocked) {
    return (
      <MasterPasswordModal
        records={records}
        onUnlock={handleUnlock}
        isLoadingRecords={isLoadingRecords}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Panel */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(7, 9, 19, 0.4)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem'
        }}>
          {/* Logo */}
          <a
            href={process.env.NEXT_PUBLIC_LAUNCHER_URL ? `${process.env.NEXT_PUBLIC_LAUNCHER_URL}/dashboard` : "https://devtech.cashms.in/dashboard"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
            title="Go to DevTech Launcher Dashboard"
          >
            <div className="btn-raised" style={{
              padding: '8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
              color: 'var(--accent-primary)',
              boxShadow: '0 0 15px 0 rgba(99, 102, 241, 0.2)'
            }}>
              <img 
                src="https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1784962617063-account-recovery.png" 
                alt="DevPass Logo" 
                style={{ width: '20px', height: '20px', objectFit: 'contain', display: 'block' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                DevPass
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--accent-success)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '1px' }}>
                Vault Active
              </span>
            </div>
          </a>

          {/* User controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="btn-raised"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                borderColor: 'rgba(255,255,255,0.06)',
                gap: '0.4rem'
              }}
              title="Change Vault Password"
            >
              <Key size={14} />
              <span>Change Password</span>
            </button>
            <button
              onClick={handleLock}
              className="btn-raised"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                borderColor: 'rgba(255,255,255,0.06)',
                gap: '0.4rem'
              }}
              title="Lock Vault"
            >
              <Key size={14} />
              <span>Lock Vault</span>
            </button>
            <div style={{
              borderLeft: '1px solid var(--glass-border)',
              paddingLeft: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        <div className="container">
          
          {/* Toolbar Search and Filters */}
          <div className="glass-card" style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div className="glass-glare"></div>

            {/* Left side filters */}
            <div style={{ display: 'flex', flex: 1, minWidth: '280px', gap: '1rem', flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
              {/* Search input */}
              <div className="inset-input-wrapper" style={{ flex: 2, minWidth: '200px' }}>
                <span style={{ paddingLeft: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="inset-input"
                  placeholder="Search by title or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '0.5rem' }}
                />
              </div>

              {/* Favorites dropdown filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="dropdown-skeuo"
                  style={{ minWidth: '130px', cursor: 'pointer' }}
                >
                  <option value="all" style={{ cursor: 'pointer' }}>All Items</option>
                  <option value="favorite" style={{ cursor: 'pointer' }}>Favorites</option>
                  <option value="unfavorite" style={{ cursor: 'pointer' }}>Unfavorites</option>
                </select>
              </div>
            </div>

            {/* Right side add password action */}
            <div style={{ position: 'relative', zIndex: 10 }}>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-raised btn-accent"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  gap: '0.5rem',
                  width: '100%'
                }}
              >
                <Plus size={18} />
                <span>Add Password</span>
              </button>
            </div>
          </div>

          {/* Records Grid */}
          {isLoadingRecords && records === null ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading secure vault credentials...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5rem 2rem',
              textAlign: 'center',
              gap: '1rem'
            }}>
              <div className="glass-glare"></div>
              <div style={{
                color: 'var(--text-muted)',
                padding: '1rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'inline-flex'
              }}>
                <Shield size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {searchQuery ? 'No Results Found' : 'Vault is Empty'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px' }}>
                {searchQuery 
                  ? 'No records match your query. Try checking your spelling or adjusting the dropdown filter.' 
                  : 'Start storing your credentials securely! Click "Add Password" above to create your first encrypted record.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-raised btn-accent"
                  style={{ marginTop: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Create Record
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
              alignItems: 'stretch'
            }}>
              {filteredRecords.map((record) => (
                <PasswordCard
                  key={record.id}
                  record={record}
                  masterPassword={masterPassword}
                  onEditClick={handleEditClick}
                  onDeleteClick={handleDelete}
                  onToggleFavorite={handleToggleFavoriteSuccess}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modals & Dialog overlays */}
      <AddPasswordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        masterPassword={masterPassword}
        onAddSuccess={handleAddSuccess}
      />

      <EditPasswordModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        masterPassword={masterPassword}
        onEditSuccess={handleEditSuccess}
      />

      <ChangeMasterPasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        masterPassword={masterPassword}
        decryptedRecords={decryptedRecords}
        onPasswordChangeSuccess={handlePasswordChangeSuccess}
      />

      {/* Toast Alert Popups */}
      {toast && (
        <div className={`alert-popup ${toast.type === 'danger' ? 'danger' : ''}`}>
          {toast.type === 'danger' ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{toast.message}</span>
        </div>
      )}

      {/* Extra styles */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
