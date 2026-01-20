import React, { useState, useEffect } from 'react';
import './Popup.css';
import { Logger } from '../../utils/logger';

const Popup = () => {
  const [remarkFeatureEnabled, setRemarkFeatureEnabled] = useState(true);
  const [videoDownloadFeatureEnabled, setVideoDownloadFeatureEnabled] =
    useState(true);
  const [downloadDirectory, setDownloadDirectory] = useState('TwitterVideos');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    Logger.logPageView('Popup', 'popup', { page: 'popup' });
    loadSettings();
  }, []);

  const loadSettings = () => {
    chrome.storage.sync.get(
      [
        'remarkFeatureEnabled',
        'videoDownloadFeatureEnabled',
        'downloadDirectory',
      ],
      (result) => {
        setRemarkFeatureEnabled((result.remarkFeatureEnabled as boolean | undefined) ?? true);
        setVideoDownloadFeatureEnabled(
          (result.videoDownloadFeatureEnabled as boolean | undefined) ?? true
        );
        setDownloadDirectory((result.downloadDirectory as string | undefined) || 'TwitterVideos');
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
        console.log('Settings saved');
        updateContentScript();
        setSaveMessage(chrome.i18n.getMessage('settingsSaved'));
        setTimeout(() => setSaveMessage(''), 3000);
      }
    );
  };

  const updateContentScript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
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
    <div className="popup-container">
      <div className="popup-content">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          {chrome.i18n.getMessage('popupTitle')}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {chrome.i18n.getMessage('customizeExperience')}
        </p>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remarkFeatureToggle"
              checked={remarkFeatureEnabled}
              onChange={(e) => setRemarkFeatureEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="remarkFeatureToggle"
              className="ml-2 block text-sm text-gray-900"
            >
              {chrome.i18n.getMessage('enableUserRemarks')}
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="videoDownloadFeatureToggle"
              checked={videoDownloadFeatureEnabled}
              onChange={(e) => setVideoDownloadFeatureEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="videoDownloadFeatureToggle"
              className="ml-2 block text-sm text-gray-900"
            >
              {chrome.i18n.getMessage('enableVideoDownload')}
            </label>
          </div>
          <div>
            <label
              htmlFor="downloadDirectory"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {chrome.i18n.getMessage('downloadDirectory')}
            </label>
            <input
              type="text"
              id="downloadDirectory"
              value={downloadDirectory}
              onChange={(e) => setDownloadDirectory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <button
            onClick={saveSettings}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {chrome.i18n.getMessage('saveSettings')}
          </button>
          {saveMessage && (
            <p className="text-sm text-green-600 text-center">{saveMessage}</p>
          )}
          <div className="flex space-x-4">
            <button
              onClick={openRemarksManager}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {chrome.i18n.getMessage('manageRemarks')}
            </button>
            <button
              onClick={openDownloadRecords}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {chrome.i18n.getMessage('manageDownloads')}
            </button>
          </div>
        </div>

        <button
          onClick={openFeedbackPage}
          className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {chrome.i18n.getMessage('provideFeedback')}
        </button>
      </div>
    </div>
  );
};

export default Popup;
