import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

export interface RemarkDialogProps {
  onSave: (username: string, remark: string) => void;
  onCancel: () => void;
  username: string;
  existingRemark?: string;
  isOpen: boolean;
}

/**
 * Detect if Twitter/X is currently in dark mode by checking background luminance.
 * Uses perceived luminance formula (0.299*R + 0.587*G + 0.114*B) to determine
 * if the background is dark (luminance < 0.5). Falls back to system preference.
 */
const detectTwitterDarkMode = (): boolean => {
  try {
    const bgColor = getComputedStyle(document.body).backgroundColor;
    const start = bgColor.indexOf('(');
    const end = bgColor.indexOf(')');
    if (start !== -1 && end !== -1) {
      const values = bgColor
        .slice(start + 1, end)
        .split(',')
        .map((s) => parseInt(s.trim(), 10));
      if (values.length >= 3) {
        const [r, g, b] = values;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Twitter brand color
const TWITTER_BLUE = '#1D9BF0';

const RemarkDialog: React.FC<RemarkDialogProps> = ({
  onSave,
  onCancel,
  username,
  existingRemark,
  isOpen,
}) => {
  const [remark, setRemark] = useState(existingRemark || '');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRemark(existingRemark || '');
      setIsDarkMode(detectTwitterDarkMode());
      // Trigger enter animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen, existingRemark]);

  const handleSave = useCallback(() => {
    onSave(username, remark.trim());
  }, [onSave, username, remark]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    },
    [handleSave, onCancel]
  );

  if (!isOpen) return null;

  // Theme-aware styles matching Twitter's design system
  const theme = {
    // Backdrop
    backdrop: isDarkMode ? 'rgba(91, 112, 131, 0.4)' : 'rgba(0, 0, 0, 0.4)',
    // Card
    cardBg: isDarkMode ? '#16181C' : '#FFFFFF',
    cardBorder: isDarkMode ? '#2F3336' : '#EFF3F4',
    // Typography
    titleColor: isDarkMode ? '#E7E9EA' : '#0F1419',
    subtitleColor: isDarkMode ? '#71767B' : '#536471',
    // Input
    inputBg: isDarkMode ? '#000000' : '#FFFFFF',
    inputBorder: isDarkMode ? '#333639' : '#CFD9DE',
    inputBorderFocus: TWITTER_BLUE,
    inputText: isDarkMode ? '#E7E9EA' : '#0F1419',
    inputPlaceholder: isDarkMode ? '#71767B' : '#536471',
    // Buttons
    cancelBg: 'transparent',
    cancelBorder: isDarkMode ? '#536471' : '#CFD9DE',
    cancelText: isDarkMode ? '#EFF3F4' : '#0F1419',
    cancelHover: isDarkMode
      ? 'rgba(239, 243, 244, 0.1)'
      : 'rgba(15, 20, 25, 0.1)',
    saveBg: TWITTER_BLUE,
    saveText: '#FFFFFF',
    saveHover: '#1A8CD8',
  };

  const isEditing = !!existingRemark;
  const title = isEditing
    ? chrome.i18n.getMessage('editRemark')
    : chrome.i18n.getMessage('addRemark');

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: theme.backdrop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.15s ease-out',
      }}
      onClick={onCancel}
    >
      {/* Dialog Card */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: isDarkMode
            ? '0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.15)',
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.2s ease-out, opacity 0.15s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.cardBorder}`,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onCancel}
            aria-label={chrome.i18n.getMessage('cancel')}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.cancelHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill={theme.titleColor}
            >
              <path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z" />
            </svg>
          </button>

          {/* Title */}
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: theme.titleColor,
              margin: 0,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>

          {/* Save Button in Header */}
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: theme.saveBg,
              color: theme.saveText,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.saveHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.saveBg;
            }}
          >
            {chrome.i18n.getMessage('save')}
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Username Context */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isDarkMode ? '#2F3336' : '#EFF3F4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill={theme.subtitleColor}
              >
                <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: theme.titleColor,
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
              >
                @{username}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: theme.subtitleColor,
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
              >
                {isEditing
                  ? chrome.i18n.getMessage('editRemark')
                  : chrome.i18n.getMessage('addRemark')}
              </div>
            </div>
          </div>

          {/* Input Field with Floating Label Effect */}
          <div
            style={{
              position: 'relative',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: '4px',
                border: `1px solid ${isFocused ? theme.inputBorderFocus : theme.inputBorder}`,
                backgroundColor: theme.inputBg,
                transition: 'border-color 0.15s ease',
                boxShadow: isFocused
                  ? `0 0 0 1px ${theme.inputBorderFocus}`
                  : 'none',
              }}
            >
              {/* Floating Label */}
              <label
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: isFocused || remark ? '4px' : '50%',
                  transform: isFocused || remark ? 'none' : 'translateY(-50%)',
                  fontSize: isFocused || remark ? '12px' : '15px',
                  color: isFocused
                    ? theme.inputBorderFocus
                    : theme.inputPlaceholder,
                  backgroundColor: theme.inputBg,
                  padding: '0 4px',
                  transition: 'all 0.15s ease',
                  pointerEvents: 'none',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
              >
                {chrome.i18n.getMessage('enterRemark')}
              </label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '24px 12px 8px 12px',
                  fontSize: '17px',
                  color: theme.inputText,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Character hint */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              fontSize: '13px',
              color: theme.subtitleColor,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            {remark.length > 0 && <span>{remark.length}</span>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RemarkDialog;
