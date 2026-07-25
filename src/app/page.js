'use client';

import Link from 'next/link';
import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import { Shield, Database, Key, CheckCircle, ArrowRight, Eye, Sparkles } from 'lucide-react';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="btn-raised" style={{
              padding: '8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
              boxShadow: '0 0 15px 0 rgba(99, 102, 241, 0.2)',
              color: 'var(--accent-primary)'
            }}>
              <img 
                src="https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1784962617063-account-recovery.png" 
                alt="DevPass Logo" 
                style={{ width: '20px', height: '20px', objectFit: 'contain', display: 'block' }}
              />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DevPass
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isLoaded && isSignedIn && (
              <Link href="/dashboard" className="btn-raised btn-accent" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            )}
            {isLoaded && !isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <button className="btn-raised" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-raised btn-accent" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="container" style={{
          padding: '4rem 1.5rem',
          textAlign: 'center',
          maxWidth: '800px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem'
        }}>
          
          <div className="glass-card" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Zero-Knowledge Secure password vault</span>
          </div>

          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '700px'
          }}>
            Your Passwords. <br />
            Stored in Your Google Sheet.
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.15rem',
            lineHeight: '1.6',
            maxWidth: '600px'
          }}>
            DevPass encrypts your passwords directly in the browser using AES-256. 
            Only encrypted ciphertexts are saved to your Google Sheets database. 
            Absolute privacy, complete control.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {isLoaded && isSignedIn && (
              <Link href="/dashboard" className="btn-raised btn-accent" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                Open Your Vault
                <ArrowRight size={18} />
              </Link>
            )}
            {isLoaded && !isSignedIn && (
              <>
                <SignUpButton mode="modal">
                  <button className="btn-raised btn-accent" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                    Create Free Account
                    <ArrowRight size={18} />
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="btn-raised" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                    Access Vault
                  </button>
                </SignInButton>
              </>
            )}
          </div>

          {/* Feature Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            width: '100%',
            marginTop: '3.5rem'
          }}>
            <div className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'left' }}>
              <div className="glass-glare"></div>
              <div style={{
                color: 'var(--accent-primary)',
                marginBottom: '1rem',
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                <Key size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Browser AES-256</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                Passwords are encrypted locally with your Master Password before they leave your computer.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'left' }}>
              <div className="glass-glare"></div>
              <div style={{
                color: 'var(--accent-primary)',
                marginBottom: '1rem',
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                <Database size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Google Sheets Backend</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                No database hosting required. Stored transparently in a spreadsheet owned entirely by you.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'left' }}>
              <div className="glass-glare"></div>
              <div style={{
                color: 'var(--accent-primary)',
                marginBottom: '1rem',
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Zero-Knowledge</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                Neither Clerk nor Google nor DevPass servers ever see your Master Password or raw credentials.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem 1.5rem',
        borderTop: '1px solid var(--glass-border)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        background: 'rgba(7, 9, 19, 0.2)'
      }}>
        <p>© 2026 DevPass Security. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
