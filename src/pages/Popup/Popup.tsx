import React, { useState, useEffect } from 'react';
import { Logger } from '../../utils/logger';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';
import '../../globals.css';

/**
 * Detect system dark mode preference
 */
const detectDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// SVG Icon Components
const TagIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M2 18.5C2 19.881 3.119 21 4.5 21h11.379c.464 0 .909-.184 1.237-.513l5.029-5.03c.342-.342.525-.79.538-1.252a1.753 1.753 0 0 0-.076-.565l-3.054-9.161C19.211 3.594 18.378 3 17.447 3H4.5C3.119 3 2 4.119 2 5.5v13Zm2-13C4 4.672 4.672 4 5.5 4h10.947c.31 0 .588.198.688.49l3.054 9.161c.029.086.035.178.02.266a.751.751 0 0 1-.218.49l-5.03 5.03a.75.75 0 0 1-.53.22H5.5C4.672 19.657 4 18.985 4 18.157V5.5ZM8.5 9c-.828 0-1.5.672-1.5 1.5S7.672 12 8.5 12s1.5-.672 1.5-1.5S9.328 9 8.5 9Z" />
  </svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M2.002 9.63c-.023.411.207.794.581.966l7.504 3.442 3.442 7.503c.164.356.52.583.909.583l.057-.002a1 1 0 0 0 .894-.686l5.595-17.032c.117-.358.023-.753-.243-1.02s-.66-.358-1.02-.243L2.688 8.736a1.001 1.001 0 0 0-.686.893Zm16.464-3.971-4.182 12.73-2.534-5.522a.998.998 0 0 0-.492-.492L5.736 9.841l12.73-4.182Z" />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M19.5 21H4.5C3.119 21 2 19.881 2 18.5v-13C2 4.119 3.119 3 4.5 3H9c.297 0 .578.132.769.36l1.98 2.366h8.751c1.381 0 2.5 1.119 2.5 2.5v10.274c0 1.381-1.119 2.5-2.5 2.5ZM4.5 5C4.224 5 4 5.224 4 5.5v13c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5V8.226c0-.276-.224-.5-.5-.5H11.25c-.297 0-.578-.132-.769-.36L8.501 5H4.5Z" />
  </svg>
);

const UserTagIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>
);

const FeedbackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-4 w-4', className)}
    fill="currentColor"
  >
    <path d="M9.64 18.952l-5.55-4.861 1.317-1.504 3.951 3.459 8.459-10.948L19.4 6.32 9.64 18.952z" />
  </svg>
);

// Custom Toggle Switch Component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  id,
}) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-twitter-blue focus-visible:ring-offset-2 focus-visible:ring-offset-twitter-card',
      checked ? 'bg-twitter-blue' : 'bg-twitter-input-border'
    )}
  >
    <span
      className={cn(
        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      )}
    />
  </button>
);

const Popup: React.FC = () => {
  const [remarkFeatureEnabled, setRemarkFeatureEnabled] = useState(true);
  const [videoDownloadFeatureEnabled, setVideoDownloadFeatureEnabled] =
    useState(true);
  const [downloadDirectory, setDownloadDirectory] = useState('TwitterVideos');
  const [saveMessage, setSaveMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(detectDarkMode);

  useEffect(() => {
    Logger.logPageView('Popup', 'popup', { page: 'popup' });
    loadSettings();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loadSettings = () => {
    chrome.storage.sync.get(
      [
        'remarkFeatureEnabled',
        'videoDownloadFeatureEnabled',
        'downloadDirectory',
      ],
      (result) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to load settings:', chrome.runtime.lastError);
          // Use default values on error
          return;
        }
        setRemarkFeatureEnabled(
          (result.remarkFeatureEnabled as boolean | undefined) ?? true
        );
        setVideoDownloadFeatureEnabled(
          (result.videoDownloadFeatureEnabled as boolean | undefined) ?? true
        );
        setDownloadDirectory(
          (result.downloadDirectory as string | undefined) || 'TwitterVideos'
        );
      }
    );
  };

  const saveSettings = () => {
    chrome.storage.sync.set(
      {
        remarkFeatureEnabled,
        videoDownloadFeatureEnabled,
        downloadDirectory,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to save settings:', chrome.runtime.lastError);
          setSaveMessage(
            chrome.i18n.getMessage('settingsSaveError') ||
              'Failed to save settings'
          );
          setTimeout(() => setSaveMessage(''), 3000);
          return;
        }
        console.log('Settings saved');
        updateContentScript();
        setSaveMessage(chrome.i18n.getMessage('settingsSaved'));
        setTimeout(() => setSaveMessage(''), 3000);
      }
    );
  };

  const updateContentScript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          remarkFeatureEnabled,
          videoDownloadFeatureEnabled,
        });
      }
    });
  };

  const openRemarksManager = () => {
    chrome.tabs.create({ url: 'options.html' });
  };

  const openDownloadRecords = () => {
    chrome.tabs.create({ url: 'downloadRecords.html' });
  };

  const openFeedbackPage = () => {
    chrome.tabs.create({ url: 'feedback.html' });
  };

  return (
    <div className="w-[400px] bg-twitter-bg p-3 font-sans transition-colors">
      <Card className="overflow-hidden rounded-2xl border border-twitter-card-border bg-twitter-card shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <CardHeader className="border-b border-twitter-card-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-twitter-blue/10">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-twitter-blue"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-twitter-text">
                {chrome.i18n.getMessage('popupTitle')}
              </CardTitle>
              <p className="text-[13px] text-twitter-text-secondary">
                {chrome.i18n.getMessage('customizeExperience')}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Feature Toggles Section */}
          <div className="space-y-0">
            {/* Remark Feature Toggle */}
            <div className="flex items-center justify-between border-b border-twitter-card-border px-5 py-4 transition-colors hover:bg-twitter-item-hover">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-twitter-success/10">
                  <TagIcon className="text-twitter-success" />
                </div>
                <label
                  htmlFor="remarkFeatureToggle"
                  className="cursor-pointer text-[15px] font-medium text-twitter-text"
                >
                  {chrome.i18n.getMessage('enableUserRemarks')}
                </label>
              </div>
              <ToggleSwitch
                id="remarkFeatureToggle"
                checked={remarkFeatureEnabled}
                onChange={setRemarkFeatureEnabled}
              />
            </div>

            {/* Video Download Toggle */}
            <div className="flex items-center justify-between border-b border-twitter-card-border px-5 py-4 transition-colors hover:bg-twitter-item-hover">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-twitter-blue/10">
                  <VideoIcon className="text-twitter-blue" />
                </div>
                <label
                  htmlFor="videoDownloadFeatureToggle"
                  className="cursor-pointer text-[15px] font-medium text-twitter-text"
                >
                  {chrome.i18n.getMessage('enableVideoDownload')}
                </label>
              </div>
              <ToggleSwitch
                id="videoDownloadFeatureToggle"
                checked={videoDownloadFeatureEnabled}
                onChange={setVideoDownloadFeatureEnabled}
              />
            </div>

            {/* Download Directory */}
            <div className="border-b border-twitter-card-border px-5 py-4">
              <div className="mb-2 flex items-center gap-2">
                <FolderIcon className="text-twitter-text-secondary" />
                <label
                  htmlFor="downloadDirectory"
                  className="text-[13px] font-medium text-twitter-text-secondary"
                >
                  {chrome.i18n.getMessage('downloadDirectory')}
                </label>
              </div>
              <Input
                type="text"
                id="downloadDirectory"
                value={downloadDirectory}
                onChange={(e) => setDownloadDirectory(e.target.value)}
                className="h-10 rounded-xl border-twitter-input-border bg-twitter-item-bg text-[15px] text-twitter-text placeholder:text-twitter-text-secondary focus:border-twitter-blue focus:ring-1 focus:ring-twitter-blue"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="px-5 py-4">
            <Button
              onClick={saveSettings}
              className="h-11 w-full rounded-full bg-twitter-blue text-[15px] font-bold text-white hover:bg-twitter-blue-hover"
            >
              {chrome.i18n.getMessage('saveSettings')}
            </Button>
            {saveMessage && (
              <div className="mt-3 flex items-center justify-center gap-2 text-[13px] font-medium text-twitter-success">
                <CheckIcon />
                {saveMessage}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center gap-3 border-t border-twitter-card-border px-6 py-4">
            <Button
              onClick={openRemarksManager}
              variant="outline"
              size="sm"
              className="rounded-full border-twitter-input-border bg-transparent px-3 text-[12px] font-semibold text-twitter-text hover:bg-twitter-item-hover"
            >
              <UserTagIcon className="mr-1" />
              {chrome.i18n.getMessage('manageRemarks')}
            </Button>
            <Button
              onClick={openDownloadRecords}
              variant="outline"
              size="sm"
              className="rounded-full border-twitter-input-border bg-transparent px-3 text-[12px] font-semibold text-twitter-text hover:bg-twitter-item-hover"
            >
              <DownloadIcon className="mr-1" />
              {chrome.i18n.getMessage('manageDownloads')}
            </Button>
          </div>

          {/* Feedback Button */}
          <div className="px-5 pb-4">
            <Button
              onClick={openFeedbackPage}
              className="h-10 w-full rounded-full bg-twitter-success text-[13px] font-bold text-white hover:bg-twitter-success-hover"
            >
              <FeedbackIcon className="mr-2" />
              {chrome.i18n.getMessage('provideFeedback')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Popup;
