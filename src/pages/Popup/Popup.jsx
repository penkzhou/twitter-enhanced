import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
  const [remarkFeatureEnabled, setRemarkFeatureEnabled] = useState(true);
  const [videoDownloadFeatureEnabled, setVideoDownloadFeatureEnabled] = useState(true);
  const [downloadDirectory, setDownloadDirectory] = useState('TwitterVideos');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    chrome.storage.sync.get(['remarkFeatureEnabled', 'videoDownloadFeatureEnabled', 'downloadDirectory'], (result) => {
      setRemarkFeatureEnabled(result.remarkFeatureEnabled || true);
      setVideoDownloadFeatureEnabled(result.videoDownloadFeatureEnabled || true);
      setDownloadDirectory(result.downloadDirectory || 'TwitterVideos');
    });
  };

  const saveSettings = () => {
    chrome.storage.sync.set({
      remarkFeatureEnabled,
      videoDownloadFeatureEnabled,
      downloadDirectory
    }, () => {
      console.log('Settings saved');
      updateContentScript();
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000); // Clear message after 3 seconds
    });
  };

  const updateContentScript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateSettings",
          remarkFeatureEnabled,
          videoDownloadFeatureEnabled
        });
      }
    });
  };

  const openRemarksManager = () => {
    chrome.tabs.create({ url: 'options.html' });
  };

  return (
    <div className="container">
      <h1>Twitter Enhanced</h1>
      <p>Customize your Twitter experience:</p>

      <div className="feature-toggle">
        <input
          type="checkbox"
          id="remarkFeatureToggle"
          checked={remarkFeatureEnabled}
          onChange={(e) => setRemarkFeatureEnabled(e.target.checked)}
        />
        <label htmlFor="remarkFeatureToggle">Enable user remarks</label>
      </div>
      <div className="feature-toggle">
        <input
          type="checkbox"
          id="videoDownloadFeatureToggle"
          checked={videoDownloadFeatureEnabled}
          onChange={(e) => setVideoDownloadFeatureEnabled(e.target.checked)}
        />
        <label htmlFor="videoDownloadFeatureToggle">Enable video download feature</label>
      </div>
      <div className="feature-toggle">
        <label htmlFor="downloadDirectory">Download Directory:</label>
        <input
          type="text"
          id="downloadDirectory"
          value={downloadDirectory}
          onChange={(e) => setDownloadDirectory(e.target.value)}
        />
      </div>
      <button onClick={saveSettings}>Save Settings</button>
      {saveMessage && <p className="save-message">{saveMessage}</p>}
      <button onClick={openRemarksManager} className="secondary-button">Manage Remarks</button>
    </div>
  );
};

export default Popup;