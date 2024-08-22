import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {

  const [remarkFeatureEnabled, setRemarkFeatureEnabled] = useState(true);
  const [videoDownloadFeatureEnabled, setVideoDownloadFeatureEnabled] = useState(true);

  useEffect(() => {
    // Load settings when component mounts
    loadSettings();
  }, []);

  const loadSettings = () => {
    chrome.storage.sync.get(['remarkFeatureEnabled', 'videoDownloadFeatureEnabled'], (result) => {

      setRemarkFeatureEnabled(result.remarkFeatureEnabled || true);
      setVideoDownloadFeatureEnabled(result.videoDownloadFeatureEnabled || true);
    });
  };

  const saveSettings = () => {
    chrome.storage.sync.set({ remarkFeatureEnabled, videoDownloadFeatureEnabled }, () => {
      console.log('Settings saved');
      updateContentScript();
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
      <button onClick={saveSettings}>Save Settings</button>
      <button onClick={openRemarksManager} className="secondary-button">Manage Remarks</button>
    </div>
  );
};

export default Popup;