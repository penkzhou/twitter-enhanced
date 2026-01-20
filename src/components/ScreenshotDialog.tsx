import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import TweetCard from './TweetCard';
import {
  TweetData,
  ScreenshotOptions,
  DEFAULT_SCREENSHOT_OPTIONS,
} from '../types/tweet';
import {
  generateScreenshot,
  downloadScreenshot,
  copyScreenshotToClipboard,
  generateFilename,
} from '../utils/screenshot';

export interface ScreenshotDialogProps {
  tweetData: TweetData;
  isOpen: boolean;
  onClose: () => void;
}

type Theme = 'light' | 'dark' | 'auto';

function detectTwitterDarkMode(): boolean {
  try {
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }
  } catch {
    // Fallback to system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

const ScreenshotDialog: React.FC<ScreenshotDialogProps> = ({
  tweetData,
  isOpen,
  onClose,
}) => {
  const [theme, setTheme] = useState<Theme>('auto');
  const [showWatermark, setShowWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // Detect dark mode only once when dialog opens to prevent re-renders
  const [isDarkMode] = useState(() => detectTwitterDarkMode());

  const getResolvedTheme = useCallback((): 'light' | 'dark' => {
    if (theme === 'auto') {
      return isDarkMode ? 'dark' : 'light';
    }
    return theme;
  }, [theme, isDarkMode]);

  // Generate preview when options change
  useEffect(() => {
    if (!isOpen) return;

    const generatePreview = async () => {
      try {
        const options: ScreenshotOptions = {
          theme: getResolvedTheme(),
          showWatermark,
          watermarkText: showWatermark ? watermarkText : undefined,
          scale: 2, // Use decent scale for preview clarity
        };
        const dataUrl = await generateScreenshot(tweetData, options);
        setPreviewDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      }
    };

    const debounceTimeout = setTimeout(generatePreview, 300);
    return () => clearTimeout(debounceTimeout);
  }, [
    isOpen,
    tweetData,
    theme,
    showWatermark,
    watermarkText,
    getResolvedTheme,
  ]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const options: ScreenshotOptions = {
        theme: getResolvedTheme(),
        showWatermark,
        watermarkText: showWatermark ? watermarkText : undefined,
        scale: DEFAULT_SCREENSHOT_OPTIONS.scale,
      };
      const dataUrl = await generateScreenshot(tweetData, options);
      const filename = generateFilename(tweetData.tweetId);
      await downloadScreenshot(dataUrl, filename);
    } catch (error) {
      console.error('Failed to download screenshot:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsGenerating(true);
    try {
      const options: ScreenshotOptions = {
        theme: getResolvedTheme(),
        showWatermark,
        watermarkText: showWatermark ? watermarkText : undefined,
        scale: DEFAULT_SCREENSHOT_OPTIONS.scale,
      };
      const dataUrl = await generateScreenshot(tweetData, options);
      await copyScreenshotToClipboard(dataUrl);
    } catch (error) {
      console.error('Failed to copy screenshot:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const colors = {
    background: isDarkMode ? 'rgb(21, 32, 43)' : 'rgb(255, 255, 255)',
    text: isDarkMode ? 'rgb(247, 249, 249)' : 'rgb(15, 20, 25)',
    secondaryText: isDarkMode ? 'rgb(139, 152, 165)' : 'rgb(83, 100, 113)',
    border: isDarkMode ? 'rgb(56, 68, 77)' : 'rgb(239, 243, 244)',
    buttonBg: 'rgb(29, 155, 240)',
    buttonHover: 'rgb(26, 140, 216)',
  };

  const dialogContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: isDarkMode
          ? 'rgba(91, 112, 131, 0.4)'
          : 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: colors.background,
          borderRadius: '16px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.28)',
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
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: colors.text,
              margin: 0,
            }}
          >
            {chrome.i18n.getMessage('screenshotTweet') || 'Screenshot Tweet'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: '20px', height: '20px', fill: colors.text }}
            >
              <path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Preview */}
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  borderRadius: '16px',
                  border: `1px solid ${colors.border}`,
                }}
              />
            ) : (
              <TweetCard
                tweetData={tweetData}
                theme={getResolvedTheme()}
                showWatermark={showWatermark}
                watermarkText={watermarkText}
              />
            )}
          </div>

          {/* Options */}
          <div style={{ marginBottom: '16px' }}>
            {/* Theme selector */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: colors.text,
                  marginBottom: '8px',
                }}
              >
                {chrome.i18n.getMessage('theme') || 'Theme'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['auto', 'light', 'dark'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      border: `1px solid ${theme === t ? colors.buttonBg : colors.border}`,
                      backgroundColor:
                        theme === t ? colors.buttonBg : 'transparent',
                      color: theme === t ? 'white' : colors.text,
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {t === 'auto'
                      ? chrome.i18n.getMessage('auto') || 'Auto'
                      : t === 'light'
                        ? chrome.i18n.getMessage('light') || 'Light'
                        : chrome.i18n.getMessage('dark') || 'Dark'}
                  </button>
                ))}
              </div>
            </div>

            {/* Watermark toggle */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.text,
                  }}
                >
                  {chrome.i18n.getMessage('addWatermark') || 'Add Watermark'}
                </span>
              </label>
            </div>

            {/* Watermark text input */}
            {showWatermark && (
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder={
                    chrome.i18n.getMessage('watermarkPlaceholder') ||
                    'Enter watermark text...'
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background,
                    color: colors.text,
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: colors.buttonBg,
                color: 'white',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: 700,
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {isGenerating
                ? chrome.i18n.getMessage('generating') || 'Generating...'
                : chrome.i18n.getMessage('download') || 'Download'}
            </button>
            <button
              onClick={handleCopyToClipboard}
              disabled={isGenerating}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '9999px',
                border: `1px solid ${colors.border}`,
                backgroundColor: 'transparent',
                color: colors.text,
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: 700,
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {chrome.i18n.getMessage('copyToClipboard') || 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(dialogContent, document.body);
};

export default ScreenshotDialog;
