'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ size = 'normal', showLabel = false, className = '' }) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Guard against hydration mismatch
  const isDark = mounted ? theme === 'dark' : false;

  const isSmall = size === 'small';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-3d-toggle-btn ${className}`}
      title={`Switch to ${isDark ? 'Light (#FAEBD7)' : 'Modern 3D Dark'} Mode`}
      aria-label={`Current theme: ${isDark ? 'Dark' : 'Light'}. Click to toggle.`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      <div
        className="theme-3d-track"
        style={{
          position: 'relative',
          width: isSmall ? '54px' : '64px',
          height: isSmall ? '28px' : '34px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isSmall ? '2px 5px' : '3px 7px',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Sun Icon */}
        <span
          className="theme-3d-icon sun"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b',
            opacity: isDark ? 0.35 : 1,
            transform: isDark ? 'scale(0.8) rotate(-45deg)' : 'scale(1) rotate(0deg)',
            transition: 'all 0.35s ease',
            zIndex: 1,
          }}
        >
          <Sun size={isSmall ? 13 : 16} strokeWidth={2.5} />
        </span>

        {/* Moon Icon */}
        <span
          className="theme-3d-icon moon"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
            opacity: isDark ? 1 : 0.35,
            transform: isDark ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(45deg)',
            transition: 'all 0.35s ease',
            zIndex: 1,
          }}
        >
          <Moon size={isSmall ? 13 : 16} strokeWidth={2.5} />
        </span>

        {/* 3D Sliding Thumb */}
        <div
          className="theme-3d-thumb"
          style={{
            position: 'absolute',
            top: isSmall ? '3px' : '4px',
            left: isSmall ? (isDark ? '28px' : '3px') : (isDark ? '34px' : '4px'),
            width: isSmall ? '22px' : '26px',
            height: isSmall ? '22px' : '26px',
            borderRadius: '50%',
            transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="thumb-inner-dot" />
        </div>
      </div>

      {showLabel && (
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            letterSpacing: '0.02em',
          }}
        >
          {isDark ? 'Dark 3D' : 'Light (#FAEBD7)'}
        </span>
      )}
    </button>
  );
}
