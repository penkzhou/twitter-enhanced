import React, { useState, useEffect } from 'react';
import { Logger } from '../../utils/logger';

// Twitter brand color
const TWITTER_BLUE = '#1D9BF0';

/**
 * Detect system dark mode preference
 */
const detectDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Get theme colors based on dark mode
 */
const getTheme = (isDark: boolean) => ({
  // Page background
  pageBg: isDark ? '#000000' : '#F7F9F9',
  // Card
  cardBg: isDark ? '#16181C' : '#FFFFFF',
  cardBorder: isDark ? '#2F3336' : '#EFF3F4',
  cardShadow: isDark
    ? '0 0 0 1px rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.4)'
    : '0 0 0 1px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.08)',
  // Typography
  titleColor: isDark ? '#E7E9EA' : '#0F1419',
  textColor: isDark ? '#E7E9EA' : '#0F1419',
  subtitleColor: isDark ? '#71767B' : '#536471',
  // Input
  inputBg: isDark ? '#000000' : '#FFFFFF',
  inputBorder: isDark ? '#333639' : '#CFD9DE',
  inputBorderFocus: TWITTER_BLUE,
  inputText: isDark ? '#E7E9EA' : '#0F1419',
  inputPlaceholder: isDark ? '#71767B' : '#536471',
  // Buttons
  primaryBg: TWITTER_BLUE,
  primaryText: '#FFFFFF',
  primaryHover: '#1A8CD8',
  primaryDisabled: 'rgba(29, 155, 240, 0.5)',
});

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const Feedback: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(detectDarkMode);
  const [isFocused, setIsFocused] = useState(false);

  const theme = getTheme(isDarkMode);

  useEffect(() => {
    Logger.logPageView('Feedback', 'feedback', { page: 'feedback' });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      Logger.logEvent('send_feedback', { feedbackContent: feedback });
      const emailSubject = encodeURIComponent(
        chrome.i18n.getMessage('feedbackEmailSubject')
      );
      const emailBody = encodeURIComponent(feedback);
      window.location.href = `mailto:penkstudio@gmail.com?subject=${emailSubject}&body=${emailBody}`;
    }
  };

  const isSubmitDisabled = !feedback.trim();

  // Icon components
  const FeedbackIcon = () => (
    <svg viewBox="0 0 24 24" width="32" height="32" fill={TWITTER_BLUE}>
      <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z" />
    </svg>
  );

  const SendIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.pageBg,
        padding: '24px',
        fontFamily,
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '500px', marginTop: '40px' }}>
        {/* Card */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            boxShadow: theme.cardShadow,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px 24px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(29, 155, 240, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <FeedbackIcon />
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: theme.titleColor,
                margin: 0,
                textAlign: 'center',
                fontFamily,
              }}
            >
              {chrome.i18n.getMessage('feedbackTitle')}
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: theme.subtitleColor,
                margin: '8px 0 0 0',
                textAlign: 'center',
                fontFamily,
                lineHeight: 1.4,
              }}
            >
              {chrome.i18n.getMessage('feedbackSubtitle') ||
                'We appreciate your feedback to improve the extension'}
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit}>
              {/* Label */}
              <label
                htmlFor="feedbackInput"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.textColor,
                  marginBottom: '8px',
                  fontFamily,
                }}
              >
                {chrome.i18n.getMessage('feedbackLabel')}
              </label>

              {/* Textarea */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  border: `1px solid ${isFocused ? theme.inputBorderFocus : theme.inputBorder}`,
                  backgroundColor: theme.inputBg,
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: isFocused
                    ? `0 0 0 1px ${theme.inputBorderFocus}`
                    : 'none',
                  marginBottom: '16px',
                }}
              >
                <textarea
                  id="feedbackInput"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={chrome.i18n.getMessage('feedbackPlaceholder')}
                  required
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '12px',
                    fontSize: '15px',
                    color: theme.inputText,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily,
                    resize: 'vertical',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Character count */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '16px',
                }}
              >
                {feedback.length > 0 && (
                  <span
                    style={{
                      fontSize: '13px',
                      color: theme.subtitleColor,
                      fontFamily,
                    }}
                  >
                    {feedback.length}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: isSubmitDisabled
                    ? theme.primaryDisabled
                    : theme.primaryBg,
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                  fontFamily,
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitDisabled) {
                    e.currentTarget.style.backgroundColor = theme.primaryHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitDisabled) {
                    e.currentTarget.style.backgroundColor = theme.primaryBg;
                  }
                }}
              >
                <SendIcon />
                {chrome.i18n.getMessage('submitFeedback')}
              </button>
            </form>

            {/* Info text */}
            <p
              style={{
                fontSize: '13px',
                color: theme.subtitleColor,
                margin: '16px 0 0 0',
                textAlign: 'center',
                fontFamily,
                lineHeight: 1.4,
              }}
            >
              {chrome.i18n.getMessage('feedbackNote') ||
                'Your feedback will be sent via email'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
